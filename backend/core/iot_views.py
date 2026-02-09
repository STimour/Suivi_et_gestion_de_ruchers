from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from core.auth_views import _get_user_from_request, _json_body, _get_bearer_token, _decode_token
from core.models import Capteur, Ruche, TypeCapteur, UtilisateurEntreprise
from core.traccar_client import TraccarError, create_device, update_device, delete_device


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


@csrf_exempt
def associate_capteur(request):
    """POST /api/capteurs/associate - Associe un capteur a une ruche et cree le device dans Traccar."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

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


@csrf_exempt
def list_capteurs(request):
    """GET /api/capteurs - Liste les capteurs de l'entreprise courante."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

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


@csrf_exempt
def update_capteur(request, capteur_id):
    """PATCH /api/capteurs/{id} - Met a jour un capteur et le device Traccar."""
    if request.method not in ("PATCH", "PUT"):
        return JsonResponse({"error": "method_not_allowed"}, status=405)

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


@csrf_exempt
def delete_capteur(request, capteur_id):
    """DELETE /api/capteurs/{id} - Supprime un capteur et le device Traccar."""
    if request.method != "DELETE":
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

    try:
        delete_device(unique_id=capteur.identifiant)
    except TraccarError as e:
        return JsonResponse({"error": str(e)}, status=502)

    capteur.delete()
    return JsonResponse({"status": "deleted"}, status=200)
