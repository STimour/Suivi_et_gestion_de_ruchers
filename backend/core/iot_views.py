import math
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_POST, require_GET, require_http_methods

from core.auth_views import _get_user_from_request, _json_body, _get_bearer_token, _decode_token
from core.models import (
    Capteur,
    Rucher,
    Ruche,
    TypeCapteur,
    UtilisateurEntreprise,
    Alerte,
    TypeAlerte,
    Notification,
    TypeNotification,
    RoleUtilisateur,
)
from core.traccar_client import TraccarError, create_device, update_device, delete_device, get_latest_position
from core.email_utils import send_email
from core.email_templates import generate_gps_alert_email_content


def _entreprise_id_from_request(request):
    token = _get_bearer_token(request)
    if not token:
        return None
    try:
        payload = _decode_token(token)
    except Exception:
        return None
    claims = payload.get("https://hasura.io/jwt/claims") or {}
    entreprise_id = (claims.get("x-hasura-entreprise-id") or "").strip()
    return entreprise_id or None


def _normalize_type(value):
    if value is None:
        return None
    v = (value or "").strip()
    if not v:
        return None
    for choice in TypeCapteur:
        if v.lower() == choice.value.lower():
            return choice.value
    return None


def _capteur_belongs_to_entreprise(capteur, entreprise_id):
    ruche = getattr(capteur, "ruche", None)
    rucher = getattr(ruche, "rucher", None)
    return rucher and str(getattr(rucher, "entreprise_id", "")) == str(entreprise_id)


def _ensure_user_in_entreprise(user, entreprise_id):
    if not entreprise_id:
        return JsonResponse({"error": "missing_entreprise_context"}, status=400)
    if not UtilisateurEntreprise.objects.filter(utilisateur=user, entreprise_id=entreprise_id).exists():
        return JsonResponse({"error": "forbidden"}, status=403)
    return None


def _serialize_capteur(capteur):
    return {
        "id": str(capteur.id),
        "type": capteur.type,
        "identifiant": capteur.identifiant,
        "actif": capteur.actif,
        "batteriePct": capteur.batteriePct,
        "derniereCommunication": capteur.derniereCommunication.isoformat() if capteur.derniereCommunication else None,
        "ruche_id": str(capteur.ruche_id),
    }


def _distance_meters(lat1, lng1, lat2, lng2):
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _get_latest_gps_or_error(capteur):
    try:
        pos = get_latest_position(capteur.identifiant)
    except TraccarError as e:
        return None, JsonResponse({"error": str(e)}, status=502)
    if not pos or pos.get("latitude") is None or pos.get("longitude") is None:
        return None, JsonResponse({"error": "gps_position_unavailable"}, status=400)
    return pos, None


def _create_iot_notifications(entreprise_id, ruche, title, message):
    admins = UtilisateurEntreprise.objects.select_related("utilisateur").filter(
        entreprise_id=entreprise_id,
        role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
    )
    notifications = []
    for ue in admins:
        notifications.append(
            Notification(
                type=TypeNotification.ALERTE_GPS.value,
                titre=title,
                message=message,
                utilisateur=ue.utilisateur,
                entreprise_id=entreprise_id,
                ruche=ruche,
            )
        )
    if notifications:
        Notification.objects.bulk_create(notifications)


@require_POST
def associate_capteur(request):
    """POST /api/capteurs/associate - Associe un capteur a une ruche et cree le device dans Traccar."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    ruche_id = (data.get("ruche_id") or data.get("rucheId") or "").strip()
    capteur_type = _normalize_type(data.get("type"))
    identifiant = (data.get("identifiant") or "").strip()
    name = (data.get("name") or "").strip()

    if not ruche_id or not capteur_type or not identifiant:
        return JsonResponse(
            {"error": "missing_fields", "detail": "ruche_id, type, identifiant requis"},
            status=400,
        )

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        ruche = Ruche.objects.select_related("rucher").get(id=ruche_id)
    except Ruche.DoesNotExist:
        return JsonResponse({"error": "ruche_not_found"}, status=404)

    ruche_entreprise_id = getattr(ruche.rucher, "entreprise_id", None)
    if not ruche_entreprise_id or str(ruche_entreprise_id) != str(entreprise_id):
        return JsonResponse({"error": "forbidden", "detail": "ruche_not_in_entreprise"}, status=403)

    if Capteur.objects.filter(identifiant=identifiant).exists():
        return JsonResponse({"error": "capteur_already_exists"}, status=409)

    if not name:
        name = f"{capteur_type} - {ruche.immatriculation}"

    try:
        device = create_device(unique_id=identifiant, name=name)
    except TraccarError as e:
        return JsonResponse({"error": str(e)}, status=502)

    with transaction.atomic():
        capteur = Capteur.objects.create(
            type=capteur_type,
            identifiant=identifiant,
            ruche=ruche,
            actif=True,
        )

    return JsonResponse(
        {
            "capteur": _serialize_capteur(capteur),
            "traccar_device": {
                "id": device.get("id"),
                "name": device.get("name"),
                "uniqueId": device.get("uniqueId"),
            },
        },
        status=201,
    )


@require_GET
def list_capteurs(request):
    """GET /api/capteurs - Liste les capteurs de l'entreprise courante."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    capteurs = (
        Capteur.objects.select_related("ruche", "ruche__rucher")
        .filter(ruche__rucher__entreprise_id=entreprise_id)
        .order_by("-created_at")
    )
    return JsonResponse({"capteurs": [_serialize_capteur(c) for c in capteurs]}, status=200)


@require_http_methods(["PATCH", "PUT"])
def update_capteur(request, capteur_id):
    """PATCH /api/capteurs/{id} - Met a jour un capteur et le device Traccar."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    new_type = _normalize_type(data.get("type")) if "type" in data else None
    new_identifiant = (data.get("identifiant") or "").strip() if "identifiant" in data else None
    new_actif = data.get("actif") if "actif" in data else None
    new_batterie = data.get("batteriePct") if "batteriePct" in data else None
    new_derniere = data.get("derniereCommunication") if "derniereCommunication" in data else None
    new_name = (data.get("name") or "").strip() if "name" in data else None

    if "type" in data and not new_type:
        return JsonResponse({"error": "invalid_type"}, status=400)

    if new_identifiant is not None and not new_identifiant:
        return JsonResponse({"error": "invalid_identifiant"}, status=400)

    if new_identifiant and Capteur.objects.exclude(id=capteur.id).filter(identifiant=new_identifiant).exists():
        return JsonResponse({"error": "capteur_identifiant_exists"}, status=409)

    old_identifiant = capteur.identifiant

    if new_type:
        capteur.type = new_type
    if new_identifiant:
        capteur.identifiant = new_identifiant
    if isinstance(new_actif, bool):
        capteur.actif = new_actif
    if new_batterie is not None:
        capteur.batteriePct = new_batterie
    if new_derniere is not None:
        capteur.derniereCommunication = new_derniere

    capteur.save()

    try:
        if new_identifiant or new_name:
            update_device(
                unique_id=old_identifiant,
                name=new_name,
                new_unique_id=new_identifiant or None,
            )
    except TraccarError as e:
        return JsonResponse({"error": str(e)}, status=502)

    return JsonResponse({"capteur": _serialize_capteur(capteur)}, status=200)


@require_http_methods(["DELETE"])
def delete_capteur(request, capteur_id):
    """DELETE /api/capteurs/{id} - Supprime un capteur et le device Traccar."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    try:
        delete_device(unique_id=capteur.identifiant)
    except TraccarError as e:
        return JsonResponse({"error": str(e)}, status=502)

    capteur.delete()
    return JsonResponse({"status": "deleted"}, status=200)


@require_POST
def activate_gps_alert(request, capteur_id):
    """POST /api/capteurs/{id}/gps-alert/activate - Active les alertes GPS et enregistre la position de reference."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if capteur.type != TypeCapteur.GPS.value:
        return JsonResponse({"error": "capteur_not_gps"}, status=400)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    threshold = data.get("thresholdMeters")
    if threshold is None:
        threshold = data.get("threshold_meters")
    if threshold is not None:
        try:
            threshold = float(threshold)
        except (TypeError, ValueError):
            return JsonResponse({"error": "invalid_threshold"}, status=400)
        if threshold <= 0:
            return JsonResponse({"error": "invalid_threshold"}, status=400)

    pos, err = _get_latest_gps_or_error(capteur)
    if err:
        return err

    ref_lat = pos.get("latitude")
    ref_lng = pos.get("longitude")

    capteur.gpsAlertActive = True
    capteur.gpsReferenceLat = ref_lat
    capteur.gpsReferenceLng = ref_lng
    if threshold is not None:
        capteur.gpsThresholdMeters = threshold
    capteur.gpsLastCheckedAt = timezone.now()
    capteur.save(
        update_fields=[
            "gpsAlertActive",
            "gpsReferenceLat",
            "gpsReferenceLng",
            "gpsThresholdMeters",
            "gpsLastCheckedAt",
        ]
    )

    return JsonResponse(
        {
            "status": "activated",
            "reference": {"lat": ref_lat, "lng": ref_lng},
            "thresholdMeters": capteur.gpsThresholdMeters,
        },
        status=200,
    )


@require_POST
def check_gps_alert(request, capteur_id):
    """POST /api/capteurs/{id}/gps-alert/check - Verifie la position et cree une alerte si besoin."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if capteur.type != TypeCapteur.GPS.value:
        return JsonResponse({"error": "capteur_not_gps"}, status=400)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    if not capteur.gpsAlertActive:
        return JsonResponse({"error": "gps_alert_not_active"}, status=400)

    threshold = data.get("thresholdMeters")
    if threshold is None:
        threshold = data.get("threshold_meters")
    if threshold is not None:
        try:
            threshold = float(threshold)
        except (TypeError, ValueError):
            return JsonResponse({"error": "invalid_threshold"}, status=400)
        if threshold <= 0:
            return JsonResponse({"error": "invalid_threshold"}, status=400)

    if threshold is not None:
        capteur.gpsThresholdMeters = threshold

    if capteur.gpsReferenceLat is None or capteur.gpsReferenceLng is None:
        return JsonResponse({"error": "gps_reference_missing"}, status=400)

    pos, err = _get_latest_gps_or_error(capteur)
    if err:
        return err

    distance = _distance_meters(
        capteur.gpsReferenceLat,
        capteur.gpsReferenceLng,
        pos.get("latitude"),
        pos.get("longitude"),
    )

    capteur.gpsLastCheckedAt = timezone.now()
    capteur.save(update_fields=["gpsLastCheckedAt", "gpsThresholdMeters"])

    if distance <= capteur.gpsThresholdMeters:
        return JsonResponse(
            {"status": "ok", "distanceMeters": distance, "thresholdMeters": capteur.gpsThresholdMeters},
            status=200,
        )

    message = (
        f"Deplacement GPS detecte pour le capteur {capteur.identifiant}. "
        f"Distance: {distance:.1f}m (seuil {capteur.gpsThresholdMeters:.1f}m)."
    )

    alerte = Alerte.objects.create(
        type=TypeAlerte.DEPLACEMENT_GPS.value,
        message=message,
        capteur=capteur,
    )

    _create_iot_notifications(
        entreprise_id=entreprise_id,
        ruche=capteur.ruche,
        title="Alerte deplacement GPS",
        message=message,
    )

    email_result = send_email(
        to_email=user.email,
        to_name=f"{user.prenom} {user.nom}".strip(),
        subject="Alerte deplacement GPS",
        html_content=generate_gps_alert_email_content(
            recipient_name=f"{user.prenom} {user.nom}".strip() or user.email,
            capteur_identifiant=capteur.identifiant,
            distance_meters=distance,
            threshold_meters=capteur.gpsThresholdMeters,
            ruche_immatriculation=getattr(capteur.ruche, "immatriculation", ""),
        ),
    )

    capteur.gpsLastAlertAt = timezone.now()
    capteur.save(update_fields=["gpsLastAlertAt"])

    response = {
        "status": "alert_sent",
        "distanceMeters": distance,
        "thresholdMeters": capteur.gpsThresholdMeters,
        "alerte": {"id": str(alerte.id), "type": alerte.type, "message": alerte.message},
        "email": {"success": bool(email_result.get("success")), "error": email_result.get("error")},
    }
    return JsonResponse(response, status=200)


@require_POST
def deactivate_gps_alert(request, capteur_id):
    """POST /api/capteurs/{id}/gps-alert/deactivate - Desactive les alertes GPS."""
    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    capteur.gpsAlertActive = False
    capteur.save(update_fields=["gpsAlertActive"])

    return JsonResponse({"status": "deactivated"}, status=200)


def get_capteur_gps_alert_status(request, capteur_id):
    """GET /api/capteurs/{id}/gps-alert/status - Etat des alertes GPS non acquittees du capteur."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    if capteur.type != TypeCapteur.GPS.value:
        return JsonResponse({"error": "capteur_not_gps"}, status=400)

    alertes = (
        Alerte.objects.filter(
            capteur=capteur,
            type=TypeAlerte.DEPLACEMENT_GPS.value,
            acquittee=False,
        )
        .order_by("-date", "-created_at")
    )
    latest = alertes.first()

    return JsonResponse(
        {
            "capteurId": str(capteur.id),
            "hasAlert": bool(latest),
            "alertesCount": alertes.count(),
            "latestAlerte": (
                {
                    "id": str(latest.id),
                    "type": latest.type,
                    "message": latest.message,
                    "date": latest.date.isoformat() if latest.date else None,
                }
                if latest
                else None
            ),
        },
        status=200,
    )


def clear_capteur_gps_alert(request, capteur_id):
    """POST /api/capteurs/{id}/gps-alert/clear - Supprime les alertes GPS non acquittees du capteur."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        capteur = Capteur.objects.select_related("ruche", "ruche__rucher").get(id=capteur_id)
    except Capteur.DoesNotExist:
        return JsonResponse({"error": "capteur_not_found"}, status=404)

    if not _capteur_belongs_to_entreprise(capteur, entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    if capteur.type != TypeCapteur.GPS.value:
        return JsonResponse({"error": "capteur_not_gps"}, status=400)

    alertes = Alerte.objects.filter(
        capteur=capteur,
        type=TypeAlerte.DEPLACEMENT_GPS.value,
        acquittee=False,
    )
    deleted_count, _ = alertes.delete()

    if deleted_count == 0:
        return JsonResponse({"status": "no_alert", "deleted": 0}, status=200)

    return JsonResponse({"status": "cleared", "deleted": deleted_count}, status=200)


def get_rucher_gps_alert_status(request, rucher_id):
    """GET /api/ruchers/{id}/gps-alert/status - Retourne l'etat des alertes GPS du rucher."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    entreprise_id = _entreprise_id_from_request(request)
    err = _ensure_user_in_entreprise(user, entreprise_id)
    if err:
        return err

    try:
        rucher = Rucher.objects.get(id=rucher_id)
    except Rucher.DoesNotExist:
        return JsonResponse({"error": "rucher_not_found"}, status=404)

    if str(getattr(rucher, "entreprise_id", "")) != str(entreprise_id):
        return JsonResponse({"error": "forbidden"}, status=403)

    gps_capteurs = list(
        Capteur.objects.select_related("ruche")
        .filter(ruche__rucher_id=rucher_id, type=TypeCapteur.GPS.value)
        .order_by("-created_at")
    )

    active_alerts = [capteur for capteur in gps_capteurs if capteur.gpsAlertActive]

    return JsonResponse(
        {
            "rucherId": str(rucher_id),
            "hasGpsCapteur": bool(gps_capteurs),
            "hasActiveAlert": bool(active_alerts),
            "activeAlertsCount": len(active_alerts),
            "capteurs": [
                {
                    "id": str(capteur.id),
                    "rucheId": str(capteur.ruche_id),
                    "rucheImmatriculation": getattr(capteur.ruche, "immatriculation", ""),
                    "identifiant": capteur.identifiant,
                    "gpsAlertActive": capteur.gpsAlertActive,
                    "thresholdMeters": capteur.gpsThresholdMeters,
                    "lastCheckedAt": capteur.gpsLastCheckedAt.isoformat() if capteur.gpsLastCheckedAt else None,
                    "lastAlertAt": capteur.gpsLastAlertAt.isoformat() if capteur.gpsLastAlertAt else None,
                }
                for capteur in gps_capteurs
            ],
        },
        status=200,
    )
