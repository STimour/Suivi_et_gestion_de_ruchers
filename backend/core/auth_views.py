import json
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone as tz_util
from django.views.decorators.csrf import csrf_exempt

from datetime import datetime, timedelta, timezone

from core.models import (
    RoleUtilisateur,
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    Invitation,
    Offre,
)
from django.contrib.auth.hashers import check_password, make_password


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
            offre_type = offre.type

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
    return user, None


@csrf_exempt
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
        actif=True,
    )

    # Récupérer les entreprises de l'utilisateur (au cas où il en a déjà via invitation)
    user_entreprises = UtilisateurEntreprise.objects.filter(
        utilisateur=user
    ).select_related("entreprise")

    # Contexte entreprise par défaut pour le JWT : première entreprise si existante
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
        },
        status=201,
    )


@csrf_exempt
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
    ).select_related("entreprise")

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


@csrf_exempt
def logout(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    # For JWT-based authentication, logout is typically handled client-side
    # by removing the token from storage. This endpoint serves as a confirmation.
    return JsonResponse({"message": "logout_successful"}, status=200)


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

    # Récupérer les entreprises et rôles de l'utilisateur
    user_entreprises = UtilisateurEntreprise.objects.filter(
        utilisateur=user
    ).select_related('entreprise')
    
    entreprises_data = []
    for ue in user_entreprises:
        entreprises_data.append({
            "id": str(ue.entreprise.id),
            "nom": ue.entreprise.nom,
            "role": ue.role
        })
    
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


@csrf_exempt
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
        invitation = Invitation.objects.select_related("entreprise").get(token=token)
    except Invitation.DoesNotExist:
        return JsonResponse({"error": "invitation_not_found"}, status=404)

    if invitation.acceptee:
        return JsonResponse({"error": "invitation_already_accepted"}, status=409)

    now = tz_util.now()
    expiration = invitation.dateExpiration
    if tz_util.is_naive(expiration):
        expiration = tz_util.make_aware(expiration)
    if expiration < now:
        return JsonResponse({"error": "invitation_expired"}, status=410)

    if invitation.email.lower() != user.email.lower():
        return JsonResponse({"error": "email_mismatch", "detail": "L'invitation ne correspond pas à cet utilisateur"}, status=403)

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
    return JsonResponse(
        {
            "message": "invitation_accepted",
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
