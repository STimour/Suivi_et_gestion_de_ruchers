from django.template.loader import render_to_string
from django.conf import settings


def generate_invitation_email_content(
    recipient_name: str,
    entreprise_nom: str,
    role_propose: str,
    envoye_par_name: str,
    date_expiration: str,
    invitation_link: str
) -> str:
    """
    Génère le contenu HTML pour l'email d'invitation d'entreprise.
    
    Args:
        recipient_name: Nom du destinataire
        entreprise_nom: Nom de l'entreprise
        role_propose: Rôle proposé (APICULTEUR, ADMIN_ENTREPRISE, LECTEUR)
        envoye_par_name: Nom de la personne qui a envoyé l'invitation
        date_expiration: Date d'expiration formatée
        invitation_link: Lien d'acceptation de l'invitation
    
    Returns:
        Contenu HTML de l'email
    """
    # Mapping des rôles vers leur affichage en français
    role_mapping = {
        'APICULTEUR': 'Apiculteur',
        'ADMIN_ENTREPRISE': 'Administrateur d\'entreprise',
        'LECTEUR': 'Lecteur'
    }
    
    role_display = role_mapping.get(role_propose, role_propose)
    
    context = {
        'recipient_name': recipient_name,
        'entreprise_nom': entreprise_nom,
        'role_propose': role_propose,
        'role_display': role_display,
        'envoye_par_name': envoye_par_name,
        'date_expiration': date_expiration,
        'invitation_link': invitation_link,
        'subject': f'Invitation à rejoindre {entreprise_nom}',
        'header_subtitle': 'Invitation d\'entreprise'
    }
    
    return render_to_string('email/entreprise_invitation.html', context)
