from unittest.mock import patch, MagicMock
from io import StringIO
from django.test import TestCase
from django.core.management import call_command
from django.utils import timezone

from core.management.commands.check_gps_alerts import _distance_meters
from core.models import (
    Utilisateur, Entreprise, Rucher, Ruche, Capteur,
    TypeFlore, TypeRuche, TypeRaceAbeille, TypeMaladie,
    TypeCapteur, UtilisateurEntreprise, RoleUtilisateur,
    TypeOffreModel, LimitationOffre, Offre, TypeOffre,
)


class DistanceMetersTest(TestCase):
    def test_same_point(self):
        self.assertAlmostEqual(_distance_meters(43.6, 3.8, 43.6, 3.8), 0.0, places=1)

    def test_known_distance(self):
        d = _distance_meters(48.8566, 2.3522, 43.2965, 5.3698)
        self.assertGreater(d, 600_000)
        self.assertLess(d, 700_000)


class CheckGpsAlertsCommandTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        for Model, values in [
            (TypeFlore, ['Lavande']),
            (TypeRuche, ['Dadant']),
            (TypeRaceAbeille, ['Buckfast']),
            (TypeMaladie, ['Aucune']),
        ]:
            for v in values:
                Model.objects.get_or_create(value=v, defaults={'label': v})

        TypeOffreModel.objects.get_or_create(value='Freemium', defaults={'titre': 'Freemium'})
        lim, _ = LimitationOffre.objects.get_or_create(
            typeOffre_id='Freemium', defaults={'nbRuchersMax': 5, 'nbCapteursMax': 5, 'nbReinesMax': 5}
        )

    def setUp(self):
        self.user = Utilisateur.objects.create(
            email='gps@test.com', nom='Test', prenom='User',
            motDePasseHash='hashed', actif=True,
        )
        self.entreprise = Entreprise.objects.create(nom='TestCo', adresse='Addr')
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user, entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
        )
        Offre.objects.create(
            entreprise=self.entreprise, type_id='Freemium', active=True,
            dateDebut=timezone.now(), nbRuchersMax=5, nbCapteursMax=5, nbReinesMax=5,
        )
        self.rucher = Rucher.objects.create(
            nom='Rucher GPS', latitude=43.6, longitude=3.8,
            flore_id='Lavande', altitude=200, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation='GPS-001', type_id='Dadant', race_id='Buckfast',
            rucher=self.rucher, maladie_id='Aucune',
        )
        self.capteur = Capteur.objects.create(
            identifiant='TRACKER001', type=TypeCapteur.GPS.value,
            ruche=self.ruche, actif=True,
            gpsAlertActive=True, gpsReferenceLat=43.6,
            gpsReferenceLng=3.8, gpsThresholdMeters=100.0,
        )

    @patch('core.management.commands.check_gps_alerts.send_email')
    @patch('core.management.commands.check_gps_alerts.get_latest_position')
    def test_no_alert_within_threshold(self, mock_pos, mock_email):
        mock_pos.return_value = {'latitude': 43.6001, 'longitude': 3.8001}
        out = StringIO()
        call_command('check_gps_alerts', stdout=out)
        mock_email.assert_not_called()

    @patch('core.management.commands.check_gps_alerts.send_email')
    @patch('core.management.commands.check_gps_alerts.get_latest_position')
    def test_alert_beyond_threshold(self, mock_pos, mock_email):
        mock_pos.return_value = {'latitude': 44.0, 'longitude': 4.0}
        mock_email.return_value = {'success': True}
        out = StringIO()
        call_command('check_gps_alerts', stdout=out)
        mock_email.assert_called_once()
        self.assertIn('Alerte', out.getvalue())

    @patch('core.management.commands.check_gps_alerts.get_latest_position')
    def test_no_position(self, mock_pos):
        mock_pos.return_value = None
        out = StringIO()
        call_command('check_gps_alerts', stdout=out)

    @patch('core.management.commands.check_gps_alerts.get_latest_position')
    def test_traccar_error(self, mock_pos):
        from core.traccar_client import TraccarError
        mock_pos.side_effect = TraccarError('test error')
        out = StringIO()
        call_command('check_gps_alerts', stdout=out)
        self.assertIn('test error', out.getvalue())
