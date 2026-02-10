import json
from unittest.mock import patch

from django.test import TestCase, Client
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from core.models import (
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Rucher,
    Ruche,
    Capteur,
    TypeCapteur,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    TypeMaladie,
    Offre,
    TypeOffreModel,
    LimitationOffre,
    Alerte,
)


class IotViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = Utilisateur.objects.create(
            nom="Test", prenom="User", email="iot@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        self.entreprise = Entreprise.objects.create(nom="IotCo", adresse="Lyon")
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user, entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE,
        )
        TypeOffreModel.objects.get_or_create(value="Freemium", defaults={"titre": "Freemium"})
        lim = LimitationOffre.objects.create(
            typeOffre_id="Freemium", nbRuchersMax=5, nbCapteursMax=1, nbReinesMax=3,
        )
        Offre.objects.create(
            entreprise=self.entreprise, type_id="Freemium",
            dateDebut=timezone.now(), active=True,
            nbRuchersMax=5, nbCapteursMax=1, nbReinesMax=3,
            limitationOffre=lim,
        )
        TypeFlore.objects.get_or_create(value="Lavande", defaults={"label": "Lavande"})
        TypeRuche.objects.get_or_create(value="Dadant", defaults={"label": "Dadant"})
        TypeRaceAbeille.objects.get_or_create(value="Buckfast", defaults={"label": "Buckfast"})
        TypeMaladie.objects.get_or_create(value="Aucune", defaults={"label": "Aucune"})

        self.rucher = Rucher.objects.create(
            nom="MonRucher", latitude=43.0, longitude=3.0,
            flore_id="Lavande", altitude=500, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1234567", type_id="Dadant",
            race_id="Buckfast", maladie_id="Aucune", rucher=self.rucher,
        )

    def _auth_header(self):
        from core.auth_views import _make_access_token
        token = _make_access_token(self.user, entreprise_id=str(self.entreprise.id))
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def _post_json(self, url, data, **kwargs):
        return self.client.post(
            url, json.dumps(data), content_type="application/json", **kwargs
        )

    @patch("core.iot_views.create_device", return_value={"id": 1, "name": "test", "uniqueId": "GPS001"})
    def test_associate_capteur_success(self, mock_create):
        resp = self._post_json("/api/capteurs/associate", {
            "ruche_id": str(self.ruche.id),
            "type": "GPS",
            "identifiant": "GPS001",
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn("capteur", data)
        self.assertTrue(Capteur.objects.filter(identifiant="GPS001").exists())

    def test_associate_capteur_missing_fields(self):
        resp = self._post_json("/api/capteurs/associate", {
            "ruche_id": str(self.ruche.id),
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 400)

    def test_associate_capteur_method_not_allowed(self):
        resp = self.client.get("/api/capteurs/associate", **self._auth_header())
        self.assertEqual(resp.status_code, 405)

    @patch("core.iot_views.create_device", return_value={"id": 1, "name": "t", "uniqueId": "DUP01"})
    def test_associate_capteur_duplicate(self, mock_create):
        Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="DUP01",
            ruche=self.ruche, actif=True,
        )
        resp = self._post_json("/api/capteurs/associate", {
            "ruche_id": str(self.ruche.id),
            "type": "GPS",
            "identifiant": "DUP01",
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 409)

    def test_associate_capteur_ruche_not_found(self):
        import uuid
        resp = self._post_json("/api/capteurs/associate", {
            "ruche_id": str(uuid.uuid4()),
            "type": "GPS",
            "identifiant": "GPS999",
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 404)

    def test_associate_capteur_no_auth(self):
        resp = self._post_json("/api/capteurs/associate", {
            "ruche_id": str(self.ruche.id),
            "type": "GPS",
            "identifiant": "NOAUTH",
        })
        self.assertEqual(resp.status_code, 401)

    def test_list_capteurs(self):
        Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="LIST01",
            ruche=self.ruche, actif=True,
        )
        Capteur.objects.create(
            type=TypeCapteur.TEMPERATURE, identifiant="LIST02",
            ruche=self.ruche, actif=True,
        )
        resp = self.client.get("/api/capteurs", **self._auth_header())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["capteurs"]), 2)

    def test_list_capteurs_method_not_allowed(self):
        resp = self._post_json("/api/capteurs", {}, **self._auth_header())
        self.assertEqual(resp.status_code, 405)

    @patch("core.iot_views.update_device", return_value={"id": 1})
    def test_update_capteur_actif(self, mock_update):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="UPD01",
            ruche=self.ruche, actif=True,
        )
        resp = self.client.patch(
            f"/api/capteurs/{capteur.id}",
            json.dumps({"actif": False}),
            content_type="application/json",
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        capteur.refresh_from_db()
        self.assertFalse(capteur.actif)

    def test_update_capteur_not_found(self):
        import uuid
        resp = self.client.patch(
            f"/api/capteurs/{uuid.uuid4()}",
            json.dumps({"actif": False}),
            content_type="application/json",
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 404)

    def test_update_capteur_invalid_type(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="UPDTYPE01",
            ruche=self.ruche, actif=True,
        )
        resp = self.client.patch(
            f"/api/capteurs/{capteur.id}",
            json.dumps({"type": "InvalidType"}),
            content_type="application/json",
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    @patch("core.iot_views.delete_device", return_value=True)
    def test_delete_capteur(self, mock_delete):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="DEL01",
            ruche=self.ruche, actif=True,
        )
        resp = self.client.delete(
            f"/api/capteurs/{capteur.id}/delete", **self._auth_header()
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(Capteur.objects.filter(id=capteur.id).exists())

    def test_delete_capteur_not_found(self):
        import uuid
        resp = self.client.delete(
            f"/api/capteurs/{uuid.uuid4()}/delete", **self._auth_header()
        )
        self.assertEqual(resp.status_code, 404)

    @patch("core.iot_views.get_latest_position", return_value={"latitude": 43.0, "longitude": 3.0})
    def test_activate_gps_alert(self, mock_pos):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSACT01",
            ruche=self.ruche, actif=True,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/activate",
            {"thresholdMeters": 200},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "activated")
        capteur.refresh_from_db()
        self.assertTrue(capteur.gpsAlertActive)
        self.assertEqual(capteur.gpsThresholdMeters, 200)
        self.assertAlmostEqual(capteur.gpsReferenceLat, 43.0)

    def test_activate_gps_alert_not_gps(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.TEMPERATURE, identifiant="NOTGPS01",
            ruche=self.ruche, actif=True,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/activate",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"], "capteur_not_gps")

    def test_activate_gps_alert_invalid_threshold(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSTH01",
            ruche=self.ruche, actif=True,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/activate",
            {"thresholdMeters": -10},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_deactivate_gps_alert(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSDEACT01",
            ruche=self.ruche, actif=True, gpsAlertActive=True,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/deactivate",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        capteur.refresh_from_db()
        self.assertFalse(capteur.gpsAlertActive)

    @patch("core.iot_views.send_email", return_value={"success": True})
    @patch("core.iot_views.get_latest_position", return_value={"latitude": 44.0, "longitude": 4.0})
    def test_check_gps_alert_triggered(self, mock_pos, mock_email):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSCHK01",
            ruche=self.ruche, actif=True,
            gpsAlertActive=True, gpsReferenceLat=43.0, gpsReferenceLng=3.0,
            gpsThresholdMeters=100,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/check",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "alert_sent")
        self.assertTrue(data["distanceMeters"] > 100)
        self.assertTrue(Alerte.objects.filter(capteur=capteur).exists())

    @patch("core.iot_views.get_latest_position", return_value={"latitude": 43.0, "longitude": 3.0})
    def test_check_gps_alert_ok(self, mock_pos):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSOK01",
            ruche=self.ruche, actif=True,
            gpsAlertActive=True, gpsReferenceLat=43.0, gpsReferenceLng=3.0,
            gpsThresholdMeters=1000,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/check",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

    def test_check_gps_alert_not_active(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSINACT01",
            ruche=self.ruche, actif=True,
            gpsAlertActive=False,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/check",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"], "gps_alert_not_active")

    def test_check_gps_alert_missing_reference(self):
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="GPSNOREF01",
            ruche=self.ruche, actif=True,
            gpsAlertActive=True, gpsReferenceLat=None, gpsReferenceLng=None,
        )
        resp = self._post_json(
            f"/api/capteurs/{capteur.id}/gps-alert/check",
            {}, **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_capteur_other_entreprise_forbidden(self):
        other_ent = Entreprise.objects.create(nom="Other", adresse="X")
        other_rucher = Rucher.objects.create(
            nom="OtherR", latitude=44.0, longitude=4.0,
            flore_id="Lavande", altitude=300, entreprise=other_ent,
        )
        other_ruche = Ruche.objects.create(
            immatriculation="B1234567", type_id="Dadant",
            race_id="Buckfast", maladie_id="Aucune", rucher=other_rucher,
        )
        capteur = Capteur.objects.create(
            type=TypeCapteur.GPS, identifiant="FORBIDDEN01",
            ruche=other_ruche, actif=True,
        )
        resp = self.client.delete(
            f"/api/capteurs/{capteur.id}/delete", **self._auth_header()
        )
        self.assertEqual(resp.status_code, 403)
