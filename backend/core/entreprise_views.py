import secrets
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from core.models import Entreprise, UtilisateurEntreprise, RoleUtilisateur, Invitation
from core.auth_views import _json_body, _get_user_from_request


def _parse_role(value):
    """Accepte 'Apiculteur' ou 'AdminEntreprise' ou 'Lecteur'."""
    if not value:
        return None
    v = (value or "").strip()
    if v in (RoleUtilisateur.APICULTEUR.value, RoleUtilisateur.ADMIN_ENTREPRISE.value, RoleUtilisateur.LECTEUR.value):
        return v
    return None


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
    if not nom or not adresse:
        return JsonResponse({"error": "missing_fields", "detail": "nom et adresse requis"}, status=400)

    entreprise = Entreprise.objects.create(nom=nom, adresse=adresse)
    UtilisateurEntreprise.objects.create(
        utilisateur=user,
        entreprise=entreprise,
        role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
    )
    return JsonResponse(
        {
            "id": str(entreprise.id),
            "nom": entreprise.nom,
            "adresse": entreprise.adresse,
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

    token = secrets.token_urlsafe(32)
    date_expiration = timezone.now() + timedelta(days=7)
    invitation = Invitation.objects.create(
        email=email,
        token=token,
        rolePropose=role_propose,
        dateExpiration=date_expiration,
        entreprise=entreprise,
        envoyeePar=user,
    )

    # TODO: envoyer un email avec le lien (ex: /accept-invitation?token=...)
    return JsonResponse(
        {
            "id": str(invitation.id),
            "token": invitation.token,
            "email": invitation.email,
            "rolePropose": invitation.rolePropose,
            "entreprise_id": str(invitation.entreprise_id),
            "dateExpiration": invitation.dateExpiration.isoformat(),
        },
        status=201,
    )
