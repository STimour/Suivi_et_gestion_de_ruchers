import os
from typing import Dict, Optional
from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException


def get_brevo_client():
    """Crée et retourne une instance du client Brevo configurée."""
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = os.getenv('BREVO_API_KEY')
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    sender_email: Optional[str] = None,
    sender_name: Optional[str] = None,
    reply_to: Optional[str] = None,
    attachments: Optional[list] = None
) -> Dict[str, any]:
    """
    Envoie un email transactionnel via Brevo.
    
    Args:
        to_email: Email du destinataire
        to_name: Nom du destinataire
        subject: Sujet de l'email
        html_content: Contenu HTML de l'email
        sender_email: Email de l'expéditeur (utilise la valeur par défaut si non spécifié)
        sender_name: Nom de l'expéditeur (utilise la valeur par défaut si non spécifié)
        reply_to: Email de réponse (optionnel)
        attachments: Liste des pièces jointes (optionnel)
    
    Returns:
        Dict contenant le statut de l'envoi et les détails
    """
    try:
        api_instance = get_brevo_client()
        
        # Configuration de l'expéditeur
        sender_email = sender_email or os.getenv('SENDER_EMAIL', 'noreply@apiculture.com')
        sender_name = sender_name or os.getenv('SENDER_NAME', 'Apiculture App')
        
        # Création de l'email
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": sender_email, "name": sender_name},
            subject=subject,
            html_content=html_content,
            reply_to={"email": reply_to} if reply_to else None,
            attachment=attachments
        )
        
        # Envoi de l'email
        api_response = api_instance.send_transac_email(send_smtp_email)
        
        return {
            "success": True,
            "message_id": api_response.message_id,
            "message": "Email envoyé avec succès"
        }
        
    except ApiException as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'envoi de l'email"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur inattendue lors de l'envoi de l'email"
        }


def send_template_email(
    to_email: str,
    to_name: str,
    template_id: int,
    params: Dict[str, any],
    sender_email: Optional[str] = None,
    sender_name: Optional[str] = None
) -> Dict[str, any]:
    """
    Envoie un email en utilisant un template Brevo.
    
    Args:
        to_email: Email du destinataire
        to_name: Nom du destinataire
        template_id: ID du template Brevo
        params: Paramètres pour le template
        sender_email: Email de l'expéditeur (utilise la valeur par défaut si non spécifié)
        sender_name: Nom de l'expéditeur (utilise la valeur par défaut si non spécifié)
    
    Returns:
        Dict contenant le statut de l'envoi et les détails
    """
    try:
        api_instance = get_brevo_client()
        
        # Configuration de l'expéditeur
        sender_email = sender_email or os.getenv('SENDER_EMAIL', 'noreply@apiculture.com')
        sender_name = sender_name or os.getenv('SENDER_NAME', 'Apiculture App')
        
        # Création de l'email avec template
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": sender_email, "name": sender_name},
            template_id=template_id,
            params=params
        )
        
        # Envoi de l'email
        api_response = api_instance.send_transac_email(send_smtp_email)
        
        return {
            "success": True,
            "message_id": api_response.message_id,
            "message": "Email template envoyé avec succès"
        }
        
    except ApiException as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur lors de l'envoi de l'email template"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Erreur inattendue lors de l'envoi de l'email template"
        }
