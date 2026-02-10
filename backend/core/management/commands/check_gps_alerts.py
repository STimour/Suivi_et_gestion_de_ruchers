import math
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.email_utils import send_email
from core.email_templates import generate_gps_alert_email_content
from core.models import (
    Capteur,
    TypeCapteur,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Alerte,
    TypeAlerte,
    Notification,
    TypeNotification,
)
from core.traccar_client import TraccarError, get_latest_position


def _distance_meters(lat1, lng1, lat2, lng2):
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


class Command(BaseCommand):
    help = "Check GPS capteurs and send alerts if moved beyond threshold."

    def handle(self, *args, **options):
        capteurs = (
            Capteur.objects.select_related("ruche", "ruche__rucher")
            .filter(
                actif=True,
                type=TypeCapteur.GPS.value,
                gpsAlertActive=True,
                gpsReferenceLat__isnull=False,
                gpsReferenceLng__isnull=False,
            )
        )

        self.stdout.write(self.style.NOTICE(f"GPS alert cron: {capteurs.count()} capteur(s) to check"))

        for capteur in capteurs:
            try:
                pos = get_latest_position(capteur.identifiant)
            except TraccarError as e:
                self.stdout.write(self.style.WARNING(f"{capteur.identifiant}: {e}"))
                continue

            if not pos or pos.get("latitude") is None or pos.get("longitude") is None:
                self.stdout.write(
                    self.style.WARNING(f"{capteur.identifiant}: position_unavailable")
                )
                continue

            distance = _distance_meters(
                capteur.gpsReferenceLat,
                capteur.gpsReferenceLng,
                pos.get("latitude"),
                pos.get("longitude"),
            )

            capteur.gpsLastCheckedAt = timezone.now()
            capteur.save(update_fields=["gpsLastCheckedAt"])

            if distance <= capteur.gpsThresholdMeters:
                self.stdout.write(
                    self.style.NOTICE(
                        f"{capteur.identifiant}: ok distance {distance:.1f}m <= threshold {capteur.gpsThresholdMeters:.1f}m"
                    )
                )
                continue

            message = (
                f"Deplacement GPS detecte pour le capteur {capteur.identifiant}. "
                f"Distance: {distance:.1f}m (seuil {capteur.gpsThresholdMeters:.1f}m)."
            )
            alerte = Alerte.objects.create(
                type=TypeAlerte.DEPLACEMENT_GPS.value,
                message=message,
                capteur=capteur,
            )

            entreprise_id = getattr(capteur.ruche.rucher, "entreprise_id", None)
            if entreprise_id:
                admins = UtilisateurEntreprise.objects.select_related("utilisateur").filter(
                    entreprise_id=entreprise_id,
                    role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
                )
                notifications = []
                for ue in admins:
                    user = ue.utilisateur
                    if not user.email:
                        continue
                    notifications.append(
                        Notification(
                            type=TypeNotification.ALERTE_GPS.value,
                            titre="Alerte deplacement GPS",
                            message=message,
                            utilisateur=user,
                            entreprise_id=entreprise_id,
                            ruche=capteur.ruche,
                        )
                    )
                    html_content = generate_gps_alert_email_content(
                        recipient_name=f"{user.prenom} {user.nom}".strip() or user.email,
                        capteur_identifiant=capteur.identifiant,
                        distance_meters=distance,
                        threshold_meters=capteur.gpsThresholdMeters,
                        ruche_immatriculation=getattr(capteur.ruche, "immatriculation", ""),
                    )
                    send_email(
                        to_email=user.email,
                        to_name=f"{user.prenom} {user.nom}".strip(),
                        subject="Alerte deplacement GPS",
                        html_content=html_content,
                    )
                if notifications:
                    Notification.objects.bulk_create(notifications)

            capteur.gpsLastAlertAt = timezone.now()
            capteur.save(update_fields=["gpsLastAlertAt"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Alerte {alerte.id} capteur {capteur.identifiant} distance {distance:.1f}m"
                )
            )
