import json
import logging
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone as tz_util
from core.models import (
    RoleUtilisateur,
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    Invitation,
    Offre,
    TypeOffre,
    EntrepriseProfile,
    AccountVerificationToken,
    PasswordResetToken,
)
from django.contrib.auth.hashers import check_password, make_password
from core.email_utils import send_email
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.consumers import _group_name_for_email
from core.email_templates import (
    generate_account_verification_email_content,
    generate_password_reset_email_content,
)

logger = logging.getLogger(__name__)


def _json_body(request):
    try:
        body = request.body.decode("utf-8") if request.body else ""
        return json.loads(body) if body else {}
    except json.JSONDecodeError:
        return None


def _jwt_secret():
    return getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY


def _make_access_token(user: Utilisateur, entreprise_id=None):
    now = datetime.now(timezone.utc)
    allowed_roles = [RoleUtilisateur.LECTEUR.value, RoleUtilisateur.APICULTEUR.value, RoleUtilisateur.ADMIN_ENTREPRISE.value]

    # Rôle de l'utilisateur dans l'entreprise (si contexte entreprise)
    role = RoleUtilisateur.LECTEUR.value
    offre_type = None
    if entreprise_id:
        try:
            user_entreprise = UtilisateurEntreprise.objects.get(
                utilisateur=user,
                entreprise_id=entreprise_id,
            )
            role = user_entreprise.role
        except UtilisateurEntreprise.DoesNotExist:
            pass

        # Offre active de l'entreprise (pour Hasura)
        offre = (
            Offre.objects.filter(entreprise_id=entreprise_id, active=True)
            .order_by("-dateDebut")
            .first()
        )
        if offre:
            offre_type = offre.type_id
        else:
            offre_type = TypeOffre.FREEMIUM.value

    hasura_claims = {
        "x-hasura-user-id": str(user.id),
        "x-hasura-default-role": role,
        "x-hasura-allowed-roles": allowed_roles,
        # alias simple si tu veux utiliser x-hasura-role côté Hasura
        "x-hasura-role": role,
    }
    if entreprise_id:
        hasura_claims["x-hasura-entreprise-id"] = str(entreprise_id)
    if offre_type:
        hasura_claims["x-hasura-offre"] = offre_type

    payload = {
        "sub": str(user.id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp()),
        "https://hasura.io/jwt/claims": hasura_claims,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def _get_bearer_token(request):
    auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if not auth:
        return None
    parts = auth.split(" ", 1)
    if len(parts) != 2:
        return None
    scheme, token = parts
    if scheme.lower() != "bearer":
        return None
    return token.strip() or None


def _decode_token(token: str):
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])


def _get_user_from_request(request):
    """Retourne (user, None) ou (None, JsonResponse) si erreur."""
    token = _get_bearer_token(request)
    if not token:
        return None, JsonResponse({"error": "missing_authorization"}, status=401)
    try:
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError:
        return None, JsonResponse({"error": "token_expired"}, status=401)
    except jwt.InvalidTokenError:
        return None, JsonResponse({"error": "invalid_token"}, status=401)
    user_id = payload.get("sub")
    if not user_id:
        return None, JsonResponse({"error": "invalid_token"}, status=401)
    try:
        user = Utilisateur.objects.get(id=user_id)
    except Utilisateur.DoesNotExist:
        return None, JsonResponse({"error": "user_not_found"}, status=404)
    if not user.actif:
        return None, JsonResponse({"error": "user_inactive"}, status=403)
    return user, None


def _serialize_offre(offre: Offre):
    if not offre:
        return None
    type_model = getattr(offre, "type", None)
    return {
        "id": str(offre.id),
        "type": {
            "value": getattr(type_model, "value", None),
            "titre": getattr(type_model, "titre", None),
            "description": getattr(type_model, "description", None),
            "prixHT": getattr(type_model, "prixHT", None),
            "prixTTC": getattr(type_model, "prixTTC", None),
            "stripeProductId": getattr(type_model, "stripeProductId", None),
        }
        if type_model
        else None,
        "dateDebut": offre.dateDebut.isoformat() if offre.dateDebut else None,
        "dateFin": offre.dateFin.isoformat() if offre.dateFin else None,
        "active": offre.active,
        "nbRuchersMax": offre.nbRuchersMax,
        "nbCapteursMax": offre.nbCapteursMax,
        "nbReinesMax": offre.nbReinesMax,
        "stripeCustomerId": offre.stripeCustomerId or "",
        "stripeSubscriptionId": offre.stripeSubscriptionId or "",
        "createdAt": offre.created_at.isoformat() if offre.created_at else None,
        "updatedAt": offre.updated_at.isoformat() if offre.updated_at else None,
    }


def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    nom = (data.get("nom") or "").strip()
    prenom = (data.get("prenom") or "").strip()

    if not email or not password or not nom or not prenom:
        return JsonResponse({"error": "missing_fields"}, status=400)

    if Utilisateur.objects.filter(email=email).exists():
        return JsonResponse({"error": "email_already_exists"}, status=409)

    user = Utilisateur.objects.create(
        email=email,
        nom=nom,
        prenom=prenom,
        motDePasseHash=make_password(password),
        actif=False,
    )

    verification_token = secrets.token_urlsafe(32)
    expiration = tz_util.now() + timedelta(hours=24)
    AccountVerificationToken.objects.create(
        token=verification_token,
        dateExpiration=expiration,
        utilisateur=user,
    )

    frontend_base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if frontend_base_url:
        verification_link = f"{frontend_base_url}/verify-account?token={verification_token}"
    else:
        verification_link = request.build_absolute_uri(
            f"/api/auth/verify-account?token={verification_token}"
        )

    # Envoi de l'email de validation
    email_sent = False
    email_error = None
    try:
        html_content = generate_account_verification_email_content(
            recipient_name=prenom or email.split("@")[0],
            verification_link=verification_link,
        )
        email_result = send_email(
            to_email=email,
            to_name=prenom or email.split("@")[0],
            subject="Validation de votre compte Abbenage",
            html_content=html_content,
        )
        email_sent = bool(email_result.get("success"))
        if not email_sent:
            email_error = email_result.get("error")
            logger.warning(
                "Email validation compte non envoye",
                extra={"email": email, "error": email_error},
            )
    except Exception:
        logger.exception("Erreur inattendue lors de l'envoi de l'email de validation")

    return JsonResponse(
        {
            "message": "verification_email_sent",
            "email_sent": email_sent,
            "email_error": email_error,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "nom": user.nom,
                "prenom": user.prenom,
                "actif": user.actif,
            },
        },
        status=201,
    )


def login(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return JsonResponse({"error": "missing_fields"}, status=400)

    try:
        user = Utilisateur.objects.get(email=email)
    except Utilisateur.DoesNotExist:
        return JsonResponse({"error": "invalid_credentials"}, status=401)

    if not user.actif:
        return JsonResponse({"error": "user_inactive"}, status=403)

    if not check_password(password, user.motDePasseHash):
        return JsonResponse({"error": "invalid_credentials"}, status=401)

    # Récupérer les entreprises et rôles de l'utilisateur
    user_entreprises = UtilisateurEntreprise.objects.filter(
        utilisateur=user
    ).select_related("entreprise").order_by("-created_at", "-id")

    default_entreprise_id = user_entreprises[0].entreprise_id if user_entreprises else None

    entreprises_data = [
        {
            "id": str(ue.entreprise.id),
            "nom": ue.entreprise.nom,
            "role": ue.role,
        }
        for ue in user_entreprises
    ]

    token = _make_access_token(user, entreprise_id=default_entreprise_id)
    return JsonResponse(
        {
            "access_token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "nom": user.nom,
                "prenom": user.prenom,
                "entreprises": entreprises_data,
            },
        }
    )


def logout(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    # For JWT-based authentication, logout is typically handled client-side
    # by removing the token from storage. This endpoint serves as a confirmation.
    return JsonResponse({"message": "logout_successful"}, status=200)


def verify_account(request):
    if request.method not in ("GET", "POST"):
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    token = (request.GET.get("token") or "").strip()
    if request.method == "POST":
        data = _json_body(request)
        if data is None:
            return JsonResponse({"error": "invalid_json"}, status=400)
        token = (data.get("token") or token or "").strip()

    if not token:
        return JsonResponse({"error": "missing_fields", "detail": "token requis"}, status=400)

    try:
        verification = AccountVerificationToken.objects.select_related("utilisateur").get(
            token=token
        )
    except AccountVerificationToken.DoesNotExist:
        return JsonResponse({"error": "invalid_token"}, status=401)

    if verification.utilise:
        return JsonResponse({"error": "token_already_used"}, status=409)

    expiration = verification.dateExpiration
    if tz_util.is_naive(expiration):
        expiration = tz_util.make_aware(expiration)
    if expiration < tz_util.now():
        return JsonResponse({"error": "token_expired"}, status=410)

    user = verification.utilisateur
    if not user.actif:
        user.actif = True
        user.save(update_fields=["actif"])

    verification.utilise = True
    verification.used_at = tz_util.now()
    verification.save(update_fields=["utilise", "used_at"])

    # Notifier les clients WebSocket en attente de validation
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = _group_name_for_email(user.email)
            async_to_sync(channel_layer.group_send)(
                group_name,
                {"type": "email_verified", "email": user.email},
            )
    except Exception:
        logger.exception("Erreur lors de l'envoi WS de validation email")

    return JsonResponse({"message": "account_verified"}, status=200)


def resend_verification_email(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    email = (data.get("email") or "").strip().lower()
    if not email:
        return JsonResponse({"error": "missing_fields", "detail": "email requis"}, status=400)

    try:
        user = Utilisateur.objects.get(email=email)
    except Utilisateur.DoesNotExist:
        return JsonResponse({"error": "user_not_found"}, status=404)

    if user.actif:
        return JsonResponse({"message": "account_already_verified"}, status=200)

    last_token = (
        AccountVerificationToken.objects.filter(utilisateur=user)
        .order_by("-created_at")
        .first()
    )
    if last_token:
        elapsed = (tz_util.now() - last_token.created_at).total_seconds()
        if elapsed < 60:
            return JsonResponse(
                {
                    "error": "resend_too_soon",
                    "message": "Veuillez patienter avant de renvoyer un email de validation.",
                    "retry_after_seconds": int(60 - elapsed),
                },
                status=429,
            )

    # Invalider les anciens tokens non utilises
    AccountVerificationToken.objects.filter(
        utilisateur=user,
        utilise=False,
    ).update(utilise=True, used_at=tz_util.now())

    verification_token = secrets.token_urlsafe(32)
    expiration = tz_util.now() + timedelta(hours=24)
    AccountVerificationToken.objects.create(
        token=verification_token,
        dateExpiration=expiration,
        utilisateur=user,
    )

    frontend_base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if frontend_base_url:
        verification_link = f"{frontend_base_url}/verify-account?token={verification_token}"
    else:
        verification_link = request.build_absolute_uri(
            f"/api/auth/verify-account?token={verification_token}"
        )

    email_sent = False
    email_error = None
    try:
        html_content = generate_account_verification_email_content(
            recipient_name=user.prenom or email.split("@")[0],
            verification_link=verification_link,
        )
        email_result = send_email(
            to_email=email,
            to_name=user.prenom or email.split("@")[0],
            subject="Validation de votre compte Abbenage",
            html_content=html_content,
        )
        email_sent = bool(email_result.get("success"))
        if not email_sent:
            email_error = email_result.get("error")
            logger.warning(
                "Email validation compte non renvoye",
                extra={"email": email, "error": email_error},
            )
    except Exception:
        logger.exception("Erreur inattendue lors du renvoi de l'email de validation")

    return JsonResponse(
        {
            "message": "verification_email_resent",
            "email_sent": email_sent,
            "email_error": email_error,
        },
        status=200,
    )


def request_password_reset(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    email = (data.get("email") or "").strip().lower()
    if not email:
        return JsonResponse({"error": "missing_fields", "detail": "email requis"}, status=400)

    try:
        user = Utilisateur.objects.get(email=email)
    except Utilisateur.DoesNotExist:
        return JsonResponse({"error": "user_not_found"}, status=404)

    # Invalider les anciens tokens non utilises
    PasswordResetToken.objects.filter(
        utilisateur=user,
        utilise=False,
    ).update(utilise=True, used_at=tz_util.now())

    reset_token = secrets.token_urlsafe(32)
    expiration = tz_util.now() + timedelta(hours=1)
    PasswordResetToken.objects.create(
        token=reset_token,
        dateExpiration=expiration,
        utilisateur=user,
    )

    frontend_base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    if frontend_base_url:
        reset_link = f"{frontend_base_url}/reset-password?token={reset_token}"
    else:
        reset_link = request.build_absolute_uri(
            f"/api/auth/reset-password?token={reset_token}"
        )

    email_sent = False
    email_error = None
    try:
        html_content = generate_password_reset_email_content(
            recipient_name=user.prenom or email.split("@")[0],
            reset_link=reset_link,
        )
        email_result = send_email(
            to_email=email,
            to_name=user.prenom or email.split("@")[0],
            subject="Reinitialisation de votre mot de passe Abbenage",
            html_content=html_content,
        )
        email_sent = bool(email_result.get("success"))
        if not email_sent:
            email_error = email_result.get("error")
            logger.warning(
                "Email reset password non envoye",
                extra={"email": email, "error": email_error},
            )
    except Exception:
        logger.exception("Erreur inattendue lors de l'envoi de l'email reset password")

    return JsonResponse(
        {
            "message": "password_reset_email_sent",
            "email_sent": email_sent,
            "email_error": email_error,
        },
        status=200,
    )


def reset_password(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    token = (data.get("token") or "").strip()
    new_password = data.get("password") or ""
    if not token or not new_password:
        return JsonResponse({"error": "missing_fields", "detail": "token et password requis"}, status=400)

    try:
        reset = PasswordResetToken.objects.select_related("utilisateur").get(token=token)
    except PasswordResetToken.DoesNotExist:
        return JsonResponse({"error": "invalid_token"}, status=401)

    if reset.utilise:
        return JsonResponse({"error": "token_already_used"}, status=409)

    expiration = reset.dateExpiration
    if tz_util.is_naive(expiration):
        expiration = tz_util.make_aware(expiration)
    if expiration < tz_util.now():
        return JsonResponse({"error": "token_expired"}, status=410)

    user = reset.utilisateur
    user.motDePasseHash = make_password(new_password)
    user.save(update_fields=["motDePasseHash"])

    reset.utilise = True
    reset.used_at = tz_util.now()
    reset.save(update_fields=["utilise", "used_at"])

    return JsonResponse({"message": "password_reset_success"}, status=200)


def me(request):
    token = _get_bearer_token(request)
    if not token:
        return JsonResponse({"error": "missing_authorization"}, status=401)

    try:
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "token_expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "invalid_token"}, status=401)

    user_id = payload.get("sub")
    if not user_id:
        return JsonResponse({"error": "invalid_token"}, status=401)

    try:
        user = Utilisateur.objects.get(id=user_id)
    except Utilisateur.DoesNotExist:
        return JsonResponse({"error": "user_not_found"}, status=404)
    if not user.actif:
        return JsonResponse({"error": "user_inactive"}, status=403)

    # Récupérer les entreprises et rôles de l'utilisateur
    user_entreprises = UtilisateurEntreprise.objects.filter(
        utilisateur=user
    ).select_related("entreprise")

    entreprises_data = []
    for ue in user_entreprises:
        entreprise_id = str(ue.entreprise.id)
        offre = (
            Offre.objects.filter(entreprise_id=entreprise_id, active=True)
            .order_by("-dateDebut")
            .first()
        )
        if offre:
            type_offre = offre.type_id
            subscription_active = bool(offre.active)
            paid = bool(
                (offre.type_id or "").lower() == TypeOffre.PREMIUM.value.lower()
                and (offre.stripeSubscriptionId or offre.stripeCustomerId)
                and offre.active
            )
        else:
            type_offre = TypeOffre.FREEMIUM.value
            subscription_active = True
            paid = False
        type_profiles = list(
            EntrepriseProfile.objects.filter(entreprise_id=entreprise_id)
            .order_by("typeProfile_id")
            .values_list("typeProfile_id", flat=True)
        )
        entreprises_data.append(
            {
                "id": entreprise_id,
                "nom": ue.entreprise.nom,
                "role": ue.role,
                "typeOffre": type_offre,
                "typeProfiles": type_profiles,
                "subscriptionActive": subscription_active,
                "paid": paid,
                "offre": _serialize_offre(offre),
            }
        )

    claims = payload.get("https://hasura.io/jwt/claims") or {}
    entreprise_id = (claims.get("x-hasura-entreprise-id") or "").strip()
    
    return JsonResponse(
        {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "nom": user.nom,
                "prenom": user.prenom,
                "actif": user.actif,
                "entreprises": entreprises_data,
            }
        }
    )


def accept_invitation(request):
    """POST /api/auth/accept-invitation - Accepter une invitation (token dans le body). Lie l'utilisateur connecté à l'entreprise avec le rôle proposé."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    token = (data.get("token") or "").strip()
    if not token:
        return JsonResponse({"error": "missing_fields", "detail": "token requis"}, status=400)

    try:
        token_payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "invalid_token"}, status=401)

    invitation_id = token_payload.get("invitation_id")
    if not invitation_id:
        return JsonResponse({"error": "invalid_token"}, status=401)

    try:
        invitation = Invitation.objects.select_related("entreprise").get(id=invitation_id)
    except Invitation.DoesNotExist:
        return JsonResponse({"error": "invitation_not_found"}, status=404)

    if invitation.token != token:
        return JsonResponse({"error": "invalid_token"}, status=401)

    if invitation.acceptee:
        return JsonResponse({"error": "invitation_already_accepted"}, status=409)

    now = tz_util.now()
    expiration = invitation.dateExpiration
    if tz_util.is_naive(expiration):
        expiration = tz_util.make_aware(expiration)
    if expiration < now:
        return JsonResponse({"error": "invitation_expired"}, status=410)

    UtilisateurEntreprise.objects.get_or_create(
        utilisateur=user,
        entreprise=invitation.entreprise,
        defaults={"role": invitation.rolePropose},
    )
    invitation.acceptee = True
    invitation.save(update_fields=["acceptee"])

    user_entreprises = UtilisateurEntreprise.objects.filter(
        utilisateur=user
    ).select_related("entreprise")
    entreprises_data = [
        {"id": str(ue.entreprise.id), "nom": ue.entreprise.nom, "role": ue.role}
        for ue in user_entreprises
    ]
    token = _make_access_token(user, entreprise_id=invitation.entreprise_id)
    return JsonResponse(
        {
            "message": "invitation_accepted",
            "access_token": token,
            "entreprise": {
                "id": str(invitation.entreprise.id),
                "nom": invitation.entreprise.nom,
                "role": invitation.rolePropose,
            },
            "user": {
                "id": str(user.id),
                "email": user.email,
                "entreprises": entreprises_data,
            },
        },
        status=200,
    )


def switch_entreprise(request):
    """POST /api/auth/switch-entreprise - Retourne un token pour une autre entreprise."""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    user, err = _get_user_from_request(request)
    if err:
        return err

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid_json"}, status=400)

    entreprise_id = (data.get("entreprise_id") or "").strip()
    if not entreprise_id:
        return JsonResponse({"error": "missing_fields", "detail": "entreprise_id requis"}, status=400)

    # Vérifier que l'utilisateur appartient bien à l'entreprise
    try:
        user_entreprise = UtilisateurEntreprise.objects.select_related("entreprise").get(
            utilisateur=user,
            entreprise_id=entreprise_id,
        )
    except UtilisateurEntreprise.DoesNotExist:
        return JsonResponse({"error": "not_in_entreprise"}, status=403)

    token = _make_access_token(user, entreprise_id=entreprise_id)
    return JsonResponse(
        {
            "access_token": token,
            "entreprise": {
                "id": str(user_entreprise.entreprise.id),
                "nom": user_entreprise.entreprise.nom,
                "role": user_entreprise.role,
            },
        },
        status=200,
    )


def current_entreprise(request):
    """GET /api/auth/current-entreprise - Retourne l'entreprise courante du token."""
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    token = _get_bearer_token(request)
    if not token:
        return JsonResponse({"error": "missing_authorization"}, status=401)

    try:
        payload = _decode_token(token)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "token_expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "invalid_token"}, status=401)

    user_id = payload.get("sub")
    if not user_id:
        return JsonResponse({"error": "invalid_token"}, status=401)

    claims = payload.get("https://hasura.io/jwt/claims") or {}
    entreprise_id = (claims.get("x-hasura-entreprise-id") or "").strip()
    if not entreprise_id:
        return JsonResponse({"entreprise": None}, status=200)

    try:
        user = Utilisateur.objects.get(id=user_id)
    except Utilisateur.DoesNotExist:
        return JsonResponse({"error": "user_not_found"}, status=404)

    try:
        user_entreprise = UtilisateurEntreprise.objects.select_related("entreprise").get(
            utilisateur=user,
            entreprise_id=entreprise_id,
        )
    except UtilisateurEntreprise.DoesNotExist:
        return JsonResponse({"error": "not_in_entreprise"}, status=403)

    offre = (
        Offre.objects.filter(entreprise_id=entreprise_id, active=True)
        .order_by("-dateDebut")
        .first()
    )
    if offre:
        type_offre = offre.type_id
        subscription_active = bool(offre.active)
        paid = bool(
            (offre.type_id or "").lower() == TypeOffre.PREMIUM.value.lower()
            and (offre.stripeSubscriptionId or offre.stripeCustomerId)
            and offre.active
        )
    else:
        type_offre = TypeOffre.FREEMIUM.value
        subscription_active = True
        paid = False

    type_profiles = list(
        EntrepriseProfile.objects.filter(entreprise_id=entreprise_id)
        .order_by("typeProfile_id")
        .values_list("typeProfile_id", flat=True)
    )

    return JsonResponse(
        {
            "entreprise": {
            "id": str(user_entreprise.entreprise.id),
            "nom": user_entreprise.entreprise.nom,
            "role": user_entreprise.role,
            "typeOffre": type_offre,
            "typeProfiles": type_profiles,
            "subscriptionActive": subscription_active,
            "paid": paid,
            "offre": _serialize_offre(offre),
        }
    },
    status=200,
)
