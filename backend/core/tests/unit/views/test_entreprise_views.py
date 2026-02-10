import json
import uuid
from unittest.mock import patch

from django.test import TestCase, Client
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from core.models import (
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Offre,
    TypeOffreModel,
    LimitationOffre,
    TypeOffre,
    TypeProfileEntrepriseModel,
    TypeProfileEntreprise,
    EntrepriseProfile,
    Invitation,
)


class EntrepriseViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = Utilisateur.objects.create(
            nom="Admin", prenom="User", email="admin@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        self.entreprise = Entreprise.objects.create(nom="MyCo", adresse="Paris")
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user, entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE,
        )
        TypeOffreModel.objects.get_or_create(value="Freemium", defaults={"titre": "Freemium"})
        TypeOffreModel.objects.get_or_create(value="Premium", defaults={"titre": "Premium"})
        self.lim_free = LimitationOffre.objects.create(
            typeOffre_id="Freemium", nbRuchersMax=5, nbCapteursMax=1, nbReinesMax=3,
        )
        self.lim_premium = LimitationOffre.objects.create(
            typeOffre_id="Premium", nbRuchersMax=-1, nbCapteursMax=3, nbReinesMax=-1,
        )
        self.offre = Offre.objects.create(
            entreprise=self.entreprise, type_id="Freemium",
            dateDebut=timezone.now(), active=True,
            nbRuchersMax=5, nbCapteursMax=1, nbReinesMax=3,
            limitationOffre=self.lim_free,
        )
        for val in (
            TypeProfileEntreprise.APICULTEUR_PRODUCTEUR,
            TypeProfileEntreprise.ELEVEUR_DE_REINES,
            TypeProfileEntreprise.POLLINISATEUR,
        ):
            TypeProfileEntrepriseModel.objects.get_or_create(
                value=val, defaults={"titre": val, "description": ""},
            )

    def _auth_header(self, user=None, entreprise_id=None):
        from core.auth_views import _make_access_token
        u = user or self.user
        eid = entreprise_id or str(self.entreprise.id)
        token = _make_access_token(u, entreprise_id=eid)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def _post_json(self, url, data, **kwargs):
        return self.client.post(
            url, json.dumps(data), content_type="application/json", **kwargs
        )

    def test_create_entreprise_success(self):
        resp = self._post_json("/api/entreprise", {
            "nom": "NewCo",
            "adresse": "Lyon",
            "typeProfiles": ["ApiculteurProducteur"],
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["nom"], "NewCo")
        self.assertIn("access_token", data)
        self.assertTrue(Entreprise.objects.filter(nom="NewCo").exists())

    def test_create_entreprise_missing_fields(self):
        resp = self._post_json("/api/entreprise", {
            "nom": "NoAddr",
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 400)

    def test_create_entreprise_method_not_allowed(self):
        resp = self.client.get("/api/entreprise", **self._auth_header())
        self.assertEqual(resp.status_code, 405)

    def test_create_entreprise_invalid_profiles(self):
        resp = self._post_json("/api/entreprise", {
            "nom": "BadProfile",
            "adresse": "Lyon",
            "typeProfiles": ["InvalidProfile"],
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 400)

    def test_create_entreprise_no_auth(self):
        resp = self._post_json("/api/entreprise", {
            "nom": "NoAuth", "adresse": "X",
        })
        self.assertEqual(resp.status_code, 401)

    @patch("core.entreprise_views.send_email", return_value={"success": True})
    def test_create_invitation_success(self, mock_email):
        resp = self._post_json("/api/entreprise/invitation", {
            "email": "invite@test.com",
            "rolePropose": "Apiculteur",
            "entreprise_id": str(self.entreprise.id),
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["email"], "invite@test.com")
        self.assertIn("token", data)

    def test_create_invitation_missing_fields(self):
        resp = self._post_json("/api/entreprise/invitation", {
            "email": "x@test.com",
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 400)

    def test_create_invitation_entreprise_not_found(self):
        resp = self._post_json("/api/entreprise/invitation", {
            "email": "x@test.com",
            "rolePropose": "Apiculteur",
            "entreprise_id": str(uuid.uuid4()),
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 404)

    @patch("core.entreprise_views.send_email", return_value={"success": True})
    def test_create_invitation_not_member(self, mock_email):
        other = Entreprise.objects.create(nom="Other", adresse="X")
        resp = self._post_json("/api/entreprise/invitation", {
            "email": "x@test.com",
            "rolePropose": "Apiculteur",
            "entreprise_id": str(other.id),
        }, **self._auth_header())
        self.assertEqual(resp.status_code, 403)

    def test_update_offre_to_premium(self):
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/offre",
            {"typeOffre": "Premium"},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["typeOffre"], "Premium")

    def test_update_offre_invalid_type(self):
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/offre",
            {"typeOffre": "Invalid"},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_update_offre_entreprise_not_found(self):
        resp = self._post_json(
            f"/api/entreprises/{uuid.uuid4()}/offre",
            {"typeOffre": "Freemium"},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 404)

    def test_update_offre_not_admin(self):
        lecteur = Utilisateur.objects.create(
            nom="Lect", prenom="Eur", email="lecteur@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        UtilisateurEntreprise.objects.create(
            utilisateur=lecteur, entreprise=self.entreprise,
            role=RoleUtilisateur.LECTEUR,
        )
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/offre",
            {"typeOffre": "Premium"},
            **self._auth_header(user=lecteur),
        )
        self.assertEqual(resp.status_code, 403)

    def test_update_profiles_success(self):
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/profiles",
            {"typeProfiles": ["ApiculteurProducteur"]},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["typeProfiles"], ["ApiculteurProducteur"])
        self.assertEqual(
            EntrepriseProfile.objects.filter(entreprise=self.entreprise).count(), 1
        )

    def test_update_profiles_empty(self):
        EntrepriseProfile.objects.create(
            entreprise=self.entreprise,
            typeProfile_id=TypeProfileEntreprise.APICULTEUR_PRODUCTEUR,
        )
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/profiles",
            {"typeProfiles": []},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            EntrepriseProfile.objects.filter(entreprise=self.entreprise).count(), 0
        )

    def test_update_profiles_invalid(self):
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/profiles",
            {"typeProfiles": ["BadProfile"]},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_update_profiles_missing_field(self):
        resp = self._post_json(
            f"/api/entreprises/{self.entreprise.id}/profiles",
            {},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_offre_status_success(self):
        resp = self.client.get(
            f"/api/entreprises/{self.entreprise.id}/offre/status",
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["type"], "Freemium")
        self.assertTrue(data["active"])

    def test_offre_status_not_found(self):
        resp = self.client.get(
            f"/api/entreprises/{uuid.uuid4()}/offre/status",
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 404)

    def test_list_type_profiles(self):
        resp = self.client.get("/api/profiles")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("profiles", data)
        self.assertTrue(len(data["profiles"]) >= 3)

    def test_list_type_profiles_method_not_allowed(self):
        resp = self._post_json("/api/profiles", {})
        self.assertEqual(resp.status_code, 405)
