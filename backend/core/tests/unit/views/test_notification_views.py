import json
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, Client, override_settings
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from core.models import (
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Rucher,
    Ruche,
    Intervention,
    TypeIntervention,
    Notification,
    TypeNotification,
    StatutRuche,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    TypeMaladie,
    Offre,
    TypeOffreModel,
    LimitationOffre,
)


class NotificationWebhookTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = Utilisateur.objects.create(
            nom="Admin", prenom="User", email="admin@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        self.other_user = Utilisateur.objects.create(
            nom="Other", prenom="Member", email="other@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        self.entreprise = Entreprise.objects.create(nom="NotifCo", adresse="Paris")
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user, entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE,
        )
        UtilisateurEntreprise.objects.create(
            utilisateur=self.other_user, entreprise=self.entreprise,
            role=RoleUtilisateur.APICULTEUR,
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
            nom="R1", latitude=43.0, longitude=3.0,
            flore_id="Lavande", altitude=500, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1234567", type_id="Dadant",
            race_id="Buckfast", maladie_id="Aucune",
            rucher=self.rucher, statut=StatutRuche.ACTIVE,
        )

    def _post_json(self, url, data, **kwargs):
        return self.client.post(
            url, json.dumps(data), content_type="application/json", **kwargs
        )

    @override_settings(HASURA_WEBHOOK_SECRET="")
    def test_intervention_created_webhook(self):
        intervention = Intervention.objects.create(
            type=TypeIntervention.VISITE, date=timezone.now(),
            ruche=self.ruche,
        )
        resp = self._post_json("/api/webhooks/intervention-created", {
            "event": {
                "data": {
                    "new": {
                        "id": str(intervention.id),
                        "ruche_id": str(self.ruche.id),
                        "type": "Visite",
                    }
                },
                "session_variables": {
                    "x-hasura-user-id": str(self.user.id),
                }
            }
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["created"], 1)
        self.assertTrue(
            Notification.objects.filter(
                utilisateur=self.other_user,
                type=TypeNotification.EQUIPE,
            ).exists()
        )

    @override_settings(HASURA_WEBHOOK_SECRET="")
    def test_intervention_webhook_missing_data(self):
        resp = self._post_json("/api/webhooks/intervention-created", {
            "event": {
                "data": {"new": {}},
                "session_variables": {},
            }
        })
        self.assertEqual(resp.status_code, 400)

    @override_settings(HASURA_WEBHOOK_SECRET="secret123")
    def test_intervention_webhook_unauthorized(self):
        resp = self._post_json("/api/webhooks/intervention-created", {
            "event": {"data": {"new": {}}, "session_variables": {}},
        })
        self.assertEqual(resp.status_code, 401)

    @override_settings(HASURA_WEBHOOK_SECRET="secret123")
    def test_intervention_webhook_with_secret(self):
        intervention = Intervention.objects.create(
            type=TypeIntervention.VISITE, date=timezone.now(),
            ruche=self.ruche,
        )
        resp = self._post_json(
            "/api/webhooks/intervention-created",
            {
                "event": {
                    "data": {
                        "new": {
                            "id": str(intervention.id),
                            "ruche_id": str(self.ruche.id),
                            "type": "Visite",
                        }
                    },
                    "session_variables": {
                        "x-hasura-user-id": str(self.user.id),
                    }
                }
            },
            HTTP_X_HASURA_WEBHOOK_SECRET="secret123",
        )
        self.assertEqual(resp.status_code, 200)

    @override_settings(HASURA_WEBHOOK_SECRET="")
    def test_daily_notifications_webhook(self):
        resp = self._post_json("/api/webhooks/daily-notifications", {})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["ok"])

    @override_settings(HASURA_WEBHOOK_SECRET="")
    def test_daily_rappel_visite(self):
        old_date = timezone.now() - timedelta(days=45)
        Intervention.objects.create(
            type=TypeIntervention.VISITE, date=old_date,
            ruche=self.ruche,
        )
        resp = self._post_json("/api/webhooks/daily-notifications", {})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                type=TypeNotification.RAPPEL_VISITE,
                ruche=self.ruche,
            ).exists()
        )

    @override_settings(HASURA_WEBHOOK_SECRET="")
    def test_daily_alerte_sanitaire(self):
        self.ruche.statut = StatutRuche.MALADE
        self.ruche.save()
        resp = self._post_json("/api/webhooks/daily-notifications", {})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            Notification.objects.filter(
                type=TypeNotification.ALERTE_SANITAIRE,
                ruche=self.ruche,
            ).exists()
        )

    def test_intervention_webhook_method_not_allowed(self):
        resp = self.client.get("/api/webhooks/intervention-created")
        self.assertEqual(resp.status_code, 405)

    def test_daily_webhook_method_not_allowed(self):
        resp = self.client.get("/api/webhooks/daily-notifications")
        self.assertEqual(resp.status_code, 405)
