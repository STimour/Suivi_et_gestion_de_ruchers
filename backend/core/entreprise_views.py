import logging
import uuid
from datetime import timedelta

import jwt
import stripe

from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from core.models import (
    Entreprise,
    EntrepriseProfile,
    TypeProfileEntreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Invitation,
    Offre,
    TypeOffre,
    TypeOffreModel,
    LimitationOffre,
    TypeProfileEntrepriseModel,
)
from core.auth_views import _json_body, _get_user_from_request, _make_access_token
from core.email_utils import send_email
from core.email_templates import generate_invitation_email_content

logger = logging.getLogger(__name__)


def _parse_role(value):
    """Accepte 'Apiculteur' ou 'AdminEntreprise' ou 'Lecteur'."""
    if not value:
        return None
    v = (value or "").strip()
    if v in (RoleUtilisateur.APICULTEUR.value, RoleUtilisateur.ADMIN_ENTREPRISE.value, RoleUtilisateur.LECTEUR.value):
        return v
    return None


def _parse_type_offre(value):
    if value is None:
        return None
    v = (value or "").strip()
    if not v:
        return None
    v_lower = v.lower()
    if v_lower == TypeOffre.FREEMIUM.value.lower():
        return TypeOffre.FREEMIUM.value
    if v_lower == TypeOffre.PREMIUM.value.lower():
        return TypeOffre.PREMIUM.value
    return None


def _parse_profiles(value):
    if value is None:
        return []
    if value == "":
        return []
    if isinstance(value, str):
        values = [value]
    else:
        try:
            values = list(value)
        except TypeError:
            return None
    if not values:
        return []
    allowed = {
        TypeProfileEntreprise.APICULTEUR_PRODUCTEUR.value,
        TypeProfileEntreprise.ELEVEUR_DE_REINES.value,
        TypeProfileEntreprise.POLLINISATEUR.value,
    }
    profiles = []
    for item in values:
        v = (item or "").strip()
        if not v:
            continue
        if v in allowed:
            profiles.append(v)
        else:
            return None
    # Deduplicate while keeping order
    seen = set()
    unique_profiles = []
    for p in profiles:
        if p not in seen:
            seen.add(p)
            unique_profiles.append(p)
    return unique_profiles


def _require_admin_entreprise(user, entreprise):
    try:
        user_entreprise = UtilisateurEntreprise.objects.get(
            utilisateur=user,
            entreprise=entreprise,
        )
    except UtilisateurEntreprise.DoesNotExist:
        return None, JsonResponse(
            {"error": "forbidden", "detail": "Vous n'êtes pas membre de cette entreprise"},
            status=403,
        )
    if user_entreprise.role != RoleUtilisateur.ADMIN_ENTREPRISE.value:
        return None, JsonResponse(
            {"error": "forbidden", "detail": "Role AdminEntreprise requis"},
            status=403,
        )
    return user_entreprise, None


def _stripe_settings_or_error():
    if not settings.STRIPE_SECRET_KEY:
        return None, JsonResponse({"error": "stripe_not_configured"}, status=500)
    if not settings.STRIPE_PREMIUM_PRICE_ID:
        return None, JsonResponse({"error": "stripe_price_not_configured"}, status=500)
    if not settings.STRIPE_SUCCESS_URL or not settings.STRIPE_CANCEL_URL:
        return None, JsonResponse({"error": "stripe_redirects_not_configured"}, status=500)
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return True, None


def _premium_limits():
    # Convention: -1 signifie illimité
    return {
        "nbRuchersMax": -1,
        "nbReinesMax": -1,
        "nbCapteursMax": 3,
    }


@csrf_exempt
def create_entreprise(request):
    """POST /api/entreprise - Créer une entreprise et lier l'utilisateur connecté comme AdminEntreprise."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    nom = (data.get("nom") or "").strip()
    adresse = (data.get("adresse") or "").strip()
    raw_profiles = data.get("typeProfiles")
    type_profiles = _parse_profiles(raw_profiles)
    if raw_profiles is not None and type_profiles is None:
        return JsonResponse(
            {"error": "invalid_profiles", "detail": "typeProfiles invalides"},
            status=400,
        )
    if not nom or not adresse:
        return JsonResponse(
            {"error": "missing_fields", "detail": "nom et adresse requis"},
            status=400,
        )

    raw_type_offre = data.get("typeOffre")
    type_offre = _parse_type_offre(raw_type_offre) if raw_type_offre is not None else TypeOffre.FREEMIUM.value
    if raw_type_offre is not None and type_offre is None:
        return JsonResponse(
            {"error": "invalid_type_offre", "detail": "typeOffre doit etre Freemium ou Premium"},
            status=400,
        )

    limitation_offre = (
        LimitationOffre.objects.filter(typeOffre_id=type_offre).order_by("id").first()
    )
    if not limitation_offre:
        return JsonResponse(
            {"error": "limitation_offre_not_found", "detail": f"Aucune limitation pour {type_offre}"},
            status=400,
        )

    entreprise = Entreprise.objects.create(nom=nom, adresse=adresse)
    if type_profiles:
        for type_profile in type_profiles:
            EntrepriseProfile.objects.create(
                entreprise=entreprise,
                typeProfile_id=type_profile,
            )
    UtilisateurEntreprise.objects.create(
        utilisateur=user,
        entreprise=entreprise,
        role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
    )
    Offre.objects.create(
        entreprise=entreprise,
        type_id=type_offre,
        dateDebut=timezone.now(),
        active=True,
        nbRuchersMax=limitation_offre.nbRuchersMax,
        nbCapteursMax=limitation_offre.nbCapteursMax,
        nbReinesMax=limitation_offre.nbReinesMax,
        stripeCustomerId="",
        limitationOffre=limitation_offre,
    )
    access_token = _make_access_token(user, entreprise_id=entreprise.id)
    return JsonResponse(
        {
            "id": str(entreprise.id),
            "nom": entreprise.nom,
            "adresse": entreprise.adresse,
            "access_token": access_token,
        },
        status=201,
    )


@csrf_exempt
def create_invitation(request):
    """POST /api/entreprise/invitation - Créer une invitation (token unique) et optionnellement envoyer un email."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    email = (data.get("email") or "").strip().lower()
    role_propose = _parse_role(data.get("rolePropose"))
    entreprise_id = (data.get("entreprise_id") or "").strip()

    if not email or not role_propose or not entreprise_id:
        return JsonResponse(
            {"error": "missing_fields", "detail": "email, rolePropose et entreprise_id requis"},
            status=400,
        )

    try:
        entreprise = Entreprise.objects.get(id=entreprise_id)
    except Entreprise.DoesNotExist:
        return JsonResponse({"error": "entreprise_not_found"}, status=404)

    # L'utilisateur doit être membre de l'entreprise (idéalement AdminEntreprise) pour inviter
    if not UtilisateurEntreprise.objects.filter(utilisateur=user, entreprise=entreprise).exists():
        return JsonResponse({"error": "forbidden", "detail": "Vous n'êtes pas membre de cette entreprise"}, status=403)

    date_expiration = timezone.now() + timedelta(days=7)
    invitation_id = uuid.uuid4()
    token_payload = {
        "invitation_id": str(invitation_id),
    }
    token = jwt.encode(
        token_payload,
        getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY,
        algorithm="HS256",
    )
    invitation = Invitation.objects.create(
        id=invitation_id,
        token=token,
        rolePropose=role_propose,
        dateExpiration=date_expiration,
        entreprise=entreprise,
        envoyeePar=user,
    )

    # Envoi de l'email d'invitation
    try:
        # Construction du lien d'invitation avec l'URL frontend configurée
        invitation_link = f"{settings.FRONTEND_URL}/accept-invitation?token={token}"
        
        # Génération du contenu HTML de l'email
        html_content = generate_invitation_email_content(
            recipient_name=email.split('@')[0],  # Utilise la partie avant @ comme nom par défaut
            entreprise_nom=entreprise.nom,
            role_propose=role_propose,
            envoye_par_name=f"{user.prenom} {user.nom}" if hasattr(user, 'prenom') and hasattr(user, 'nom') else user.email,
            date_expiration=date_expiration.strftime('%d/%m/%Y à %H:%M'),
            invitation_link=invitation_link
        )
        
        # Envoi de l'email
        email_result = send_email(
            to_email=email,
            to_name=email.split('@')[0],
            subject=f"Invitation à rejoindre {entreprise.nom}",
            html_content=html_content
        )
        
        if not email_result['success']:
            # Log l'erreur mais ne bloque pas la création de l'invitation
            logger.warning(
                "Email invitation non envoye",
                extra={
                    "email": email,
                    "entreprise_id": str(entreprise.id),
                    "error": email_result.get("error"),
                },
            )
            
    except Exception as e:
        # Log l'erreur mais ne bloque pas la création de l'invitation
        logger.exception(
            "Erreur inattendue lors de l'envoi de l'email d'invitation",
            extra={"email": email, "entreprise_id": str(entreprise.id)},
        )

    email_sent = email_result.get("success", False) if "email_result" in locals() else False
    response = {
        "id": str(invitation.id),
        "token": invitation.token,
        "email": email,
        "rolePropose": invitation.rolePropose,
        "entreprise_id": str(invitation.entreprise_id),
        "dateExpiration": invitation.dateExpiration.isoformat(),
        "email_sent": email_sent,
    }
    if not email_sent and "email_result" in locals():
        response["email_error"] = email_result.get("error")

    return JsonResponse(response, status=201)


@csrf_exempt
def create_premium_checkout(request, entreprise_id):
    """POST /api/entreprises/{id}/checkout/premium - Crée une session Stripe Checkout (subscription) pour Premium."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    try:
        entreprise = Entreprise.objects.get(id=entreprise_id)
    except Entreprise.DoesNotExist:
        return JsonResponse({"error": "entreprise_not_found"}, status=404)

    _, err = _require_admin_entreprise(user, entreprise)
    if err:
        return err

    _, err = _stripe_settings_or_error()
    if err:
        return err

    offre = (
        Offre.objects.filter(entreprise=entreprise)
        .order_by("-dateDebut")
        .first()
    )
    stripe_customer_id = (offre.stripeCustomerId if offre else "") or ""

    session_params = {
        "mode": "subscription",
        "line_items": [{"price": settings.STRIPE_PREMIUM_PRICE_ID, "quantity": 1}],
        "metadata": {"entreprise_id": str(entreprise.id)},
        "success_url": settings.STRIPE_SUCCESS_URL,
        "cancel_url": settings.STRIPE_CANCEL_URL,
    }
    if stripe_customer_id:
        session_params["customer"] = stripe_customer_id
    else:
        session_params["customer_email"] = user.email

    try:
        session = stripe.checkout.Session.create(**session_params)
    except Exception:
        logger.exception("Erreur Stripe lors de la creation de Checkout Session Premium")
        return JsonResponse({"error": "stripe_checkout_failed"}, status=502)

    return JsonResponse({"url": session.url}, status=200)


@csrf_exempt
def update_entreprise_offre(request, entreprise_id):
    """POST /api/entreprises/{id}/offre - Mettre a jour le type d'offre d'une entreprise."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    try:
        entreprise = Entreprise.objects.get(id=entreprise_id)
    except Entreprise.DoesNotExist:
        return JsonResponse({"error": "entreprise_not_found"}, status=404)

    _, err = _require_admin_entreprise(user, entreprise)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    raw_type_offre = data.get("typeOffre")
    type_offre = _parse_type_offre(raw_type_offre)
    if type_offre is None:
        return JsonResponse(
            {"error": "invalid_type_offre", "detail": "typeOffre doit etre Freemium ou Premium"},
            status=400,
        )

    limitation_offre = (
        LimitationOffre.objects.filter(typeOffre_id=type_offre).order_by("id").first()
    )
    if not limitation_offre:
        return JsonResponse(
            {"error": "limitation_offre_not_found", "detail": f"Aucune limitation pour {type_offre}"},
            status=400,
        )

    if type_offre == TypeOffre.PREMIUM.value:
        limits = _premium_limits()
    else:
        limits = {
            "nbRuchersMax": limitation_offre.nbRuchersMax,
            "nbCapteursMax": limitation_offre.nbCapteursMax,
            "nbReinesMax": limitation_offre.nbReinesMax,
        }

    with transaction.atomic():
        offre, created = Offre.objects.select_for_update().get_or_create(
            entreprise=entreprise,
            defaults={
                "type_id": type_offre,
                "dateDebut": timezone.now(),
                "active": True,
                "nbRuchersMax": limits["nbRuchersMax"],
                "nbCapteursMax": limits["nbCapteursMax"],
                "nbReinesMax": limits["nbReinesMax"],
                "stripeCustomerId": "",
                "stripeSubscriptionId": "",
                "limitationOffre": limitation_offre,
            },
        )
        if not created:
            offre.type_id = type_offre
            offre.dateDebut = timezone.now()
            offre.dateFin = None
            offre.active = True
            offre.nbRuchersMax = limits["nbRuchersMax"]
            offre.nbCapteursMax = limits["nbCapteursMax"]
            offre.nbReinesMax = limits["nbReinesMax"]
            if type_offre == TypeOffre.FREEMIUM.value:
                offre.stripeSubscriptionId = ""
            offre.limitationOffre = limitation_offre
            offre.save()

    return JsonResponse(
        {
            "entreprise_id": str(entreprise.id),
            "typeOffre": type_offre,
            "nbRuchersMax": limits["nbRuchersMax"],
            "nbCapteursMax": limits["nbCapteursMax"],
            "nbReinesMax": limits["nbReinesMax"],
        },
        status=200,
    )


@csrf_exempt
def update_entreprise_profiles(request, entreprise_id):
    """POST /api/entreprises/{id}/profiles - Mettre a jour les profils d'une entreprise."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    try:
        entreprise = Entreprise.objects.get(id=entreprise_id)
    except Entreprise.DoesNotExist:
        return JsonResponse({"error": "entreprise_not_found"}, status=404)

    _, err = _require_admin_entreprise(user, entreprise)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    raw_profiles = data.get("typeProfiles")
    if raw_profiles is None:
        return JsonResponse(
            {"error": "missing_fields", "detail": "typeProfiles requis"},
            status=400,
        )

    type_profiles = _parse_profiles(raw_profiles)
    if type_profiles is None:
        return JsonResponse(
            {"error": "invalid_profiles", "detail": "typeProfiles invalides"},
            status=400,
        )

    # S'assurer que les profils existent dans la table type_profile_entreprise
    for profile_value in (
        TypeProfileEntreprise.APICULTEUR_PRODUCTEUR.value,
        TypeProfileEntreprise.ELEVEUR_DE_REINES.value,
        TypeProfileEntreprise.POLLINISATEUR.value,
    ):
        TypeProfileEntrepriseModel.objects.get_or_create(
            value=profile_value,
            defaults={"titre": profile_value, "description": ""},
        )

    with transaction.atomic():
        EntrepriseProfile.objects.filter(entreprise=entreprise).delete()
        for type_profile in type_profiles:
            EntrepriseProfile.objects.create(
                entreprise=entreprise,
                typeProfile_id=type_profile,
            )

    return JsonResponse(
        {
            "entreprise_id": str(entreprise.id),
            "typeProfiles": type_profiles,
        },
        status=200,
    )


@csrf_exempt
def get_entreprise_offre_status(request, entreprise_id):
    """GET /api/entreprises/{id}/offre/status - Statut de l'offre pour l'entreprise."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    try:
        entreprise = Entreprise.objects.get(id=entreprise_id)
    except Entreprise.DoesNotExist:
        return JsonResponse({"error": "entreprise_not_found"}, status=404)

    _, err = _require_admin_entreprise(user, entreprise)
    if err:
        return err

    offre = Offre.objects.filter(entreprise=entreprise).first()
    if not offre:
        return JsonResponse({"error": "offre_not_found"}, status=404)

    type_value = (offre.type_id or "").strip()
    is_premium = type_value.lower() == TypeOffre.PREMIUM.value.lower()
    paid = bool(is_premium and (offre.stripeSubscriptionId or offre.stripeCustomerId))

    return JsonResponse(
        {
            "entreprise_id": str(entreprise.id),
            "type": type_value,
            "active": offre.active,
            "stripeCustomerId": offre.stripeCustomerId or "",
            "stripeSubscriptionId": offre.stripeSubscriptionId or "",
            "paid": paid,
        },
        status=200,
    )


@csrf_exempt
def list_type_profiles(request):
    """GET /api/profiles - Liste des profils entreprise."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    profiles = list(TypeProfileEntrepriseModel.objects.all().order_by("value"))
    if profiles:
        data = [
            {
                "value": profile.value,
                "titre": profile.titre,
                "description": profile.description,
            }
            for profile in profiles
        ]
    else:
        # Fallback si la table n'est pas seedee
        data = [
            {
                "value": TypeProfileEntreprise.APICULTEUR_PRODUCTEUR.value,
                "titre": "ApiculteurProducteur",
                "description": "",
            },
            {
                "value": TypeProfileEntreprise.ELEVEUR_DE_REINES.value,
                "titre": "EleveurDeReines",
                "description": "",
            },
            {
                "value": TypeProfileEntreprise.POLLINISATEUR.value,
                "titre": "Pollinisateur",
                "description": "",
            },
        ]

    return JsonResponse({"profiles": data}, status=200)


@csrf_exempt
def stripe_webhook(request):
    """POST /api/stripe/webhook - Webhook Stripe pour activer l'offre Premium."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    if not settings.STRIPE_WEBHOOK_SECRET:
        return JsonResponse({"error": "stripe_webhook_not_configured"}, status=500)

    payload = request.body
    sig_header = request.headers.get("Stripe-Signature") or request.META.get("HTTP_STRIPE_SIGNATURE")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        logger.warning("Webhook Stripe payload invalide")
        return JsonResponse({"error": "invalid_payload"}, status=400)
    except stripe.error.SignatureVerificationError:
        logger.warning("Webhook Stripe signature invalide")
        return JsonResponse({"error": "invalid_signature"}, status=400)

    event_type = event.get("type")
    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {}) or {}
        metadata = session.get("metadata") or {}
        entreprise_id = (metadata.get("entreprise_id") or "").strip()
        if not entreprise_id:
            logger.warning("Webhook Stripe sans entreprise_id", extra={"event_id": event.get("id")})
            return JsonResponse({"status": "ignored"}, status=200)

        try:
            entreprise = Entreprise.objects.get(id=entreprise_id)
        except Entreprise.DoesNotExist:
            logger.warning(
                "Webhook Stripe pour entreprise inconnue",
                extra={"entreprise_id": entreprise_id, "event_id": event.get("id")},
            )
            return JsonResponse({"status": "ignored"}, status=200)

        premium_type = TypeOffreModel.objects.filter(value=TypeOffre.PREMIUM.value).first()
        limitation_offre = (
            LimitationOffre.objects.filter(typeOffre_id=TypeOffre.PREMIUM.value)
            .order_by("id")
            .first()
        )
        if not premium_type or not limitation_offre:
            logger.error("TypeOffre Premium ou limitation introuvable")
            return JsonResponse({"error": "premium_config_missing"}, status=500)

        limits = _premium_limits()
        subscription_id = session.get("subscription") or ""
        customer_id = session.get("customer") or ""

        with transaction.atomic():
            offre, created = Offre.objects.select_for_update().get_or_create(
                entreprise=entreprise,
                defaults={
                    "type": premium_type,
                    "dateDebut": timezone.now(),
                    "active": True,
                    "nbRuchersMax": limits["nbRuchersMax"],
                    "nbCapteursMax": limits["nbCapteursMax"],
                    "nbReinesMax": limits["nbReinesMax"],
                    "stripeCustomerId": customer_id,
                    "stripeSubscriptionId": subscription_id,
                    "limitationOffre": limitation_offre,
                },
            )
            if not created:
                offre.type = premium_type
                offre.dateDebut = timezone.now()
                offre.dateFin = None
                offre.active = True
                offre.nbRuchersMax = limits["nbRuchersMax"]
                offre.nbCapteursMax = limits["nbCapteursMax"]
                offre.nbReinesMax = limits["nbReinesMax"]
                if customer_id:
                    offre.stripeCustomerId = customer_id
                if subscription_id:
                    offre.stripeSubscriptionId = subscription_id
                offre.limitationOffre = limitation_offre
                offre.save()

    return JsonResponse({"status": "ok"}, status=200)
