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
        'header_subtitle': 'Invitation d\'entreprise',
        'header_badge': 'Invitation',
    }
    
    return render_to_string('email/entreprise_invitation.html', context)


def generate_account_verification_email_content(
    recipient_name: str,
    verification_link: str
) -> str:
    """
    Génère le contenu HTML pour l'email de validation de compte.

    Args:
        recipient_name: Nom du destinataire
        verification_link: Lien de validation du compte

    Returns:
        Contenu HTML de l'email
    """
    context = {
        'recipient_name': recipient_name,
        'verification_link': verification_link,
        'subject': 'Validation de votre compte Abbenage',
        'header_subtitle': 'Validation du compte',
        'header_badge': 'Validation',
    }

    return render_to_string('email/account_verification.html', context)


def generate_password_reset_email_content(
    recipient_name: str,
    reset_link: str
) -> str:
    """
    Génère le contenu HTML pour l'email de réinitialisation de mot de passe.

    Args:
        recipient_name: Nom du destinataire
        reset_link: Lien de réinitialisation

    Returns:
        Contenu HTML de l'email
    """
    context = {
        'recipient_name': recipient_name,
        'reset_link': reset_link,
        'subject': 'Reinitialisation de votre mot de passe Abbenage',
        'header_subtitle': 'Reinitialisation du mot de passe',
        'header_badge': 'Securite',
    }

    return render_to_string('email/password_reset.html', context)


def generate_gps_alert_email_content(
    recipient_name: str,
    capteur_identifiant: str,
    distance_meters: float,
    threshold_meters: float,
    ruche_immatriculation: str = ""
) -> str:
    """
    Génère le contenu HTML pour l'email d'alerte GPS.

    Args:
        recipient_name: Nom du destinataire
        capteur_identifiant: Identifiant du capteur
        distance_meters: Distance mesurée
        threshold_meters: Seuil configuré
        ruche_immatriculation: Immatriculation de la ruche (optionnel)

    Returns:
        Contenu HTML de l'email
    """
    context = {
        'recipient_name': recipient_name,
        'capteur_identifiant': capteur_identifiant,
        'distance_meters': distance_meters,
        'threshold_meters': threshold_meters,
        'ruche_immatriculation': ruche_immatriculation,
        'subject': 'Alerte deplacement GPS',
        'header_subtitle': 'Alerte GPS',
        'header_badge': 'Alerte',
    }

    return render_to_string('email/gps_alert.html', context)
