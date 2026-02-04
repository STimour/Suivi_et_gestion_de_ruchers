import logging
from datetime import timedelta

import jwt

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from core.models import Entreprise, UtilisateurEntreprise, RoleUtilisateur, Invitation, Offre, TypeOffre
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
    Offre.objects.create(
        entreprise=entreprise,
        type=TypeOffre.FREEMIUM.value,
        dateDebut=timezone.now(),
        active=True,
        nbRuchersMax=1,
        nbCapteursMax=0,
        stripeCustomerId="",
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
    token_payload = {
        "type": "invitation",
        "entreprise_id": str(entreprise.id),
        "email": email,
        "role": role_propose,
        "iat": int(timezone.now().timestamp()),
        "exp": int(date_expiration.timestamp()),
    }
    token = jwt.encode(
        token_payload,
        getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY,
        algorithm="HS256",
    )
    invitation = Invitation.objects.create(
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
