import json
import logging
from datetime import timedelta

from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from core.models import (
    Notification,
    TypeNotification,
    Utilisateur,
    UtilisateurEntreprise,
    Ruche,
    StatutRuche,
    Intervention,
    TypeIntervention,
)

logger = logging.getLogger(__name__)

CALENDRIER_APICOLE = {
    2: "C'est la periode de preparation des cadres",
    3: "C'est la periode de premiere visite de printemps",
    4: "C'est la periode de surveillance d'essaimage",
    5: "C'est la periode de pose des hausses",
    6: "C'est la periode de recolte de printemps",
    7: "C'est la periode de recolte d'ete",
    9: "C'est la periode de traitement anti-varroa",
    10: "C'est la periode de nourrissement d'hiver",
    11: "C'est la periode de preparation de l'hivernage",
}


def _verify_webhook_secret(request):
    secret = request.headers.get('X-Hasura-Webhook-Secret', '')
    expected = getattr(settings, 'HASURA_WEBHOOK_SECRET', '')
    if not expected:
        return True
    return secret == expected


def _get_entreprise_members(entreprise_id):
    return UtilisateurEntreprise.objects.filter(
        entreprise_id=entreprise_id
    ).select_related('utilisateur')


@csrf_exempt
@require_POST
def webhook_intervention_created(request):
    if not _verify_webhook_secret(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    event = body.get('event', {})
    new_data = event.get('data', {}).get('new', {})
    session = event.get('session_variables') or {}

    ruche_id = new_data.get('ruche_id')
    intervention_type = new_data.get('type', '')
    intervention_id = new_data.get('id')
    creator_id = session.get('x-hasura-user-id')

    if not ruche_id or not creator_id:
        return JsonResponse({'error': 'Missing ruche_id or user_id'}, status=400)

    try:
        ruche = Ruche.objects.select_related('rucher__entreprise').get(id=ruche_id)
    except Ruche.DoesNotExist:
        return JsonResponse({'error': 'Ruche not found'}, status=404)

    entreprise = ruche.rucher.entreprise
    if not entreprise:
        return JsonResponse({'ok': True, 'created': 0})

    try:
        creator = Utilisateur.objects.get(id=creator_id)
    except Utilisateur.DoesNotExist:
        return JsonResponse({'error': 'Creator not found'}, status=404)

    membres = _get_entreprise_members(entreprise.id)
    notifications = []
    for membre in membres:
        if str(membre.utilisateur_id) == str(creator_id):
            continue
        notifications.append(
            Notification(
                type=TypeNotification.EQUIPE,
                titre=f"Nouvelle intervention {intervention_type}",
                message=f"{creator.prenom} {creator.nom} a cree une intervention {intervention_type} sur {ruche.immatriculation}",
                utilisateur=membre.utilisateur,
                entreprise=entreprise,
                ruche=ruche,
                intervention_id=intervention_id,
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications)

    return JsonResponse({'ok': True, 'created': len(notifications)})


@csrf_exempt
@require_POST
def webhook_daily_notifications(request):
    if not _verify_webhook_secret(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    today = timezone.now().date()
    created_count = 0

    created_count += _generate_rappels_visite(today)
    created_count += _generate_rappels_traitement(today)
    created_count += _generate_rappels_saisonniers(today)
    created_count += _generate_alertes_sanitaires(today)

    return JsonResponse({'ok': True, 'created': created_count})


def _generate_rappels_visite(today):
    seuil = timezone.now() - timedelta(days=30)
    ruches = Ruche.objects.filter(
        statut__in=[StatutRuche.ACTIVE, StatutRuche.FAIBLE]
    ).select_related('rucher__entreprise')

    created = 0
    for ruche in ruches:
        entreprise = ruche.rucher.entreprise
        if not entreprise:
            continue

        derniere = Intervention.objects.filter(
            ruche=ruche
        ).order_by('-date').first()

        if derniere and derniere.date >= seuil:
            continue

        already = Notification.objects.filter(
            type=TypeNotification.RAPPEL_VISITE,
            ruche=ruche,
            date__date=today,
        ).exists()
        if already:
            continue

        membres = _get_entreprise_members(entreprise.id)
        notifications = [
            Notification(
                type=TypeNotification.RAPPEL_VISITE,
                titre=f"Visite requise sur {ruche.immatriculation}",
                message=f"Aucune visite sur {ruche.immatriculation} depuis plus de 30 jours",
                utilisateur=m.utilisateur,
                entreprise=entreprise,
                ruche=ruche,
            )
            for m in membres
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
            created += len(notifications)

    return created


def _generate_rappels_traitement(today):
    trois_jours = today + timedelta(days=3)
    ruches_traitees = Intervention.objects.filter(
        type=TypeIntervention.TRAITEMENT,
    ).values_list('ruche_id', flat=True).distinct()

    created = 0
    for ruche_id in ruches_traitees:
        try:
            ruche = Ruche.objects.select_related('rucher__entreprise').get(
                id=ruche_id,
                statut__in=[StatutRuche.ACTIVE, StatutRuche.FAIBLE, StatutRuche.MALADE],
            )
        except Ruche.DoesNotExist:
            continue

        entreprise = ruche.rucher.entreprise
        if not entreprise:
            continue

        dernier_traitement = Intervention.objects.filter(
            ruche=ruche, type=TypeIntervention.TRAITEMENT
        ).order_by('-date').first()

        if not dernier_traitement:
            continue

        jours_depuis = (timezone.now() - dernier_traitement.date).days
        if jours_depuis < 27 or jours_depuis > 33:
            continue

        already = Notification.objects.filter(
            type=TypeNotification.RAPPEL_TRAITEMENT,
            ruche=ruche,
            date__date=today,
        ).exists()
        if already:
            continue

        membres = _get_entreprise_members(entreprise.id)
        notifications = [
            Notification(
                type=TypeNotification.RAPPEL_TRAITEMENT,
                titre=f"Traitement a prevoir sur {ruche.immatriculation}",
                message=f"Le prochain traitement sur {ruche.immatriculation} approche (dernier il y a {jours_depuis} jours)",
                utilisateur=m.utilisateur,
                entreprise=entreprise,
                ruche=ruche,
            )
            for m in membres
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
            created += len(notifications)

    return created


def _generate_rappels_saisonniers(today):
    if today.day != 1:
        return 0

    mois = today.month
    message_saisonnier = CALENDRIER_APICOLE.get(mois)
    if not message_saisonnier:
        return 0

    created = 0
    entreprises_ids = UtilisateurEntreprise.objects.values_list(
        'entreprise_id', flat=True
    ).distinct()

    for entreprise_id in entreprises_ids:
        already = Notification.objects.filter(
            type=TypeNotification.SAISONNIER,
            entreprise_id=entreprise_id,
            date__date=today,
        ).exists()
        if already:
            continue

        membres = _get_entreprise_members(entreprise_id)
        notifications = [
            Notification(
                type=TypeNotification.SAISONNIER,
                titre="Rappel saisonnier",
                message=message_saisonnier,
                utilisateur=m.utilisateur,
                entreprise_id=entreprise_id,
            )
            for m in membres
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
            created += len(notifications)

    return created


def _generate_alertes_sanitaires(today):
    ruches_malades = Ruche.objects.filter(
        statut=StatutRuche.MALADE
    ).select_related('rucher__entreprise')

    seuil = timezone.now() - timedelta(days=14)
    created = 0

    for ruche in ruches_malades:
        entreprise = ruche.rucher.entreprise
        if not entreprise:
            continue

        traitement_recent = Intervention.objects.filter(
            ruche=ruche,
            type=TypeIntervention.TRAITEMENT,
            date__gte=seuil,
        ).exists()

        if traitement_recent:
            continue

        already = Notification.objects.filter(
            type=TypeNotification.ALERTE_SANITAIRE,
            ruche=ruche,
            date__date=today,
        ).exists()
        if already:
            continue

        membres = _get_entreprise_members(entreprise.id)
        notifications = [
            Notification(
                type=TypeNotification.ALERTE_SANITAIRE,
                titre=f"Alerte sanitaire : {ruche.immatriculation}",
                message=f"La ruche {ruche.immatriculation} est Malade sans traitement recent",
                utilisateur=m.utilisateur,
                entreprise=entreprise,
                ruche=ruche,
            )
            for m in membres
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
            created += len(notifications)

    return created
