import json
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, Client
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

from core.models import (
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
    AccountVerificationToken,
    PasswordResetToken,
    Offre,
    TypeOffreModel,
    LimitationOffre,
)


class AuthViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.password = "TestPass123!"
        self.user = Utilisateur.objects.create(
            nom="Dupont",
            prenom="Jean",
            email="jean@test.com",
            motDePasseHash=make_password(self.password),
            actif=True,
        )
        self.entreprise = Entreprise.objects.create(nom="TestApi", adresse="Paris")
        TypeOffreModel.objects.get_or_create(value="Freemium", defaults={"titre": "Freemium"})
        TypeOffreModel.objects.get_or_create(value="Premium", defaults={"titre": "Premium"})
        lim = LimitationOffre.objects.create(
            typeOffre_id="Freemium", nbRuchersMax=5, nbCapteursMax=1, nbReinesMax=3,
        )
        Offre.objects.create(
            entreprise=self.entreprise,
            type_id="Freemium",
            dateDebut=timezone.now(),
            active=True,
            nbRuchersMax=5,
            nbCapteursMax=1,
            nbReinesMax=3,
            limitationOffre=lim,
        )
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user,
            entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE,
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

    @patch("core.auth_views.send_email", return_value={"success": True})
    def test_register_success(self, mock_email):
        resp = self._post_json("/api/auth/register", {
            "email": "new@test.com",
            "password": "Abc123!",
            "nom": "Doe",
            "prenom": "Jane",
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["user"]["email"], "new@test.com")
        self.assertFalse(data["user"]["actif"])
        self.assertTrue(
            AccountVerificationToken.objects.filter(
                utilisateur__email="new@test.com"
            ).exists()
        )

    def test_register_missing_fields(self):
        resp = self._post_json("/api/auth/register", {"email": "x@test.com"})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["error"], "missing_fields")

    @patch("core.auth_views.send_email", return_value={"success": True})
    def test_register_duplicate_email(self, mock_email):
        self._post_json("/api/auth/register", {
            "email": "dup@test.com", "password": "Abc123!", "nom": "A", "prenom": "B",
        })
        resp = self._post_json("/api/auth/register", {
            "email": "dup@test.com", "password": "Abc123!", "nom": "C", "prenom": "D",
        })
        self.assertEqual(resp.status_code, 409)

    def test_register_method_not_allowed(self):
        resp = self.client.get("/api/auth/register")
        self.assertEqual(resp.status_code, 405)

    def test_register_invalid_json(self):
        resp = self.client.post(
            "/api/auth/register", "not json", content_type="application/json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_login_success(self):
        resp = self._post_json("/api/auth/login", {
            "email": "jean@test.com", "password": self.password,
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "jean@test.com")
        self.assertEqual(len(data["user"]["entreprises"]), 1)

    def test_login_wrong_password(self):
        resp = self._post_json("/api/auth/login", {
            "email": "jean@test.com", "password": "wrong",
        })
        self.assertEqual(resp.status_code, 401)

    def test_login_user_not_found(self):
        resp = self._post_json("/api/auth/login", {
            "email": "nobody@test.com", "password": "x",
        })
        self.assertEqual(resp.status_code, 401)

    def test_login_user_inactive(self):
        Utilisateur.objects.create(
            nom="Inactif", prenom="User", email="inactive@test.com",
            motDePasseHash=make_password("pass"), actif=False,
        )
        resp = self._post_json("/api/auth/login", {
            "email": "inactive@test.com", "password": "pass",
        })
        self.assertEqual(resp.status_code, 403)

    def test_login_missing_fields(self):
        resp = self._post_json("/api/auth/login", {"email": "jean@test.com"})
        self.assertEqual(resp.status_code, 400)

    def test_login_method_not_allowed(self):
        resp = self.client.get("/api/auth/login")
        self.assertEqual(resp.status_code, 405)

    def test_logout_success(self):
        resp = self._post_json("/api/auth/logout", {})
        self.assertEqual(resp.status_code, 200)

    @patch("core.auth_views.get_channel_layer", return_value=None)
    def test_verify_account_success(self, mock_cl):
        user = Utilisateur.objects.create(
            nom="V", prenom="U", email="verify@test.com",
            motDePasseHash=make_password("pass"), actif=False,
        )
        AccountVerificationToken.objects.create(
            token="abc123",
            dateExpiration=timezone.now() + timedelta(hours=24),
            utilisateur=user,
        )
        resp = self.client.get("/api/auth/verify-account?token=abc123")
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.actif)

    @patch("core.auth_views.get_channel_layer", return_value=None)
    def test_verify_account_post(self, mock_cl):
        user = Utilisateur.objects.create(
            nom="VP", prenom="UP", email="vpost@test.com",
            motDePasseHash=make_password("pass"), actif=False,
        )
        AccountVerificationToken.objects.create(
            token="post123",
            dateExpiration=timezone.now() + timedelta(hours=24),
            utilisateur=user,
        )
        resp = self._post_json("/api/auth/verify-account", {"token": "post123"})
        self.assertEqual(resp.status_code, 200)

    def test_verify_account_invalid_token(self):
        resp = self.client.get("/api/auth/verify-account?token=badtoken")
        self.assertEqual(resp.status_code, 401)

    def test_verify_account_expired(self):
        user = Utilisateur.objects.create(
            nom="E", prenom="X", email="exp@test.com",
            motDePasseHash="h", actif=False,
        )
        AccountVerificationToken.objects.create(
            token="expired123",
            dateExpiration=timezone.now() - timedelta(hours=1),
            utilisateur=user,
        )
        resp = self.client.get("/api/auth/verify-account?token=expired123")
        self.assertEqual(resp.status_code, 410)

    def test_verify_account_already_used(self):
        user = Utilisateur.objects.create(
            nom="U", prenom="S", email="used@test.com", motDePasseHash="h",
        )
        AccountVerificationToken.objects.create(
            token="used123",
            dateExpiration=timezone.now() + timedelta(hours=24),
            utilisateur=user,
            utilise=True,
        )
        resp = self.client.get("/api/auth/verify-account?token=used123")
        self.assertEqual(resp.status_code, 409)

    def test_verify_account_missing_token(self):
        resp = self.client.get("/api/auth/verify-account")
        self.assertEqual(resp.status_code, 400)

    @patch("core.auth_views.send_email", return_value={"success": True})
    def test_resend_verification_success(self, mock_email):
        user = Utilisateur.objects.create(
            nom="R", prenom="V", email="resend@test.com",
            motDePasseHash="h", actif=False,
        )
        token = AccountVerificationToken.objects.create(
            token="old",
            dateExpiration=timezone.now() + timedelta(hours=24),
            utilisateur=user,
        )
        AccountVerificationToken.objects.filter(id=token.id).update(
            created_at=timezone.now() - timedelta(minutes=5)
        )
        resp = self._post_json("/api/auth/resend-verification", {"email": "resend@test.com"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["message"], "verification_email_resent")

    def test_resend_verification_too_soon(self):
        user = Utilisateur.objects.create(
            nom="R2", prenom="V2", email="resend2@test.com",
            motDePasseHash="h", actif=False,
        )
        AccountVerificationToken.objects.create(
            token="recent",
            dateExpiration=timezone.now() + timedelta(hours=24),
            utilisateur=user,
        )
        resp = self._post_json("/api/auth/resend-verification", {"email": "resend2@test.com"})
        self.assertEqual(resp.status_code, 429)

    def test_resend_verification_already_active(self):
        resp = self._post_json("/api/auth/resend-verification", {"email": "jean@test.com"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["message"], "account_already_verified")

    def test_resend_verification_user_not_found(self):
        resp = self._post_json("/api/auth/resend-verification", {"email": "nobody@test.com"})
        self.assertEqual(resp.status_code, 404)

    def test_resend_verification_missing_email(self):
        resp = self._post_json("/api/auth/resend-verification", {})
        self.assertEqual(resp.status_code, 400)

    @patch("core.auth_views.send_email", return_value={"success": True})
    def test_request_password_reset_success(self, mock_email):
        resp = self._post_json("/api/auth/request-password-reset", {"email": "jean@test.com"})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(PasswordResetToken.objects.filter(utilisateur=self.user).exists())

    def test_request_password_reset_not_found(self):
        resp = self._post_json("/api/auth/request-password-reset", {"email": "nobody@test.com"})
        self.assertEqual(resp.status_code, 404)

    def test_request_password_reset_missing_email(self):
        resp = self._post_json("/api/auth/request-password-reset", {})
        self.assertEqual(resp.status_code, 400)

    def test_reset_password_success(self):
        PasswordResetToken.objects.create(
            token="resetme",
            dateExpiration=timezone.now() + timedelta(hours=1),
            utilisateur=self.user,
        )
        resp = self._post_json("/api/auth/reset-password", {
            "token": "resetme", "password": "NewPass456!",
        })
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(check_password("NewPass456!", self.user.motDePasseHash))

    def test_reset_password_invalid_token(self):
        resp = self._post_json("/api/auth/reset-password", {
            "token": "bad", "password": "x",
        })
        self.assertEqual(resp.status_code, 401)

    def test_reset_password_expired(self):
        PasswordResetToken.objects.create(
            token="expiredpw",
            dateExpiration=timezone.now() - timedelta(hours=1),
            utilisateur=self.user,
        )
        resp = self._post_json("/api/auth/reset-password", {
            "token": "expiredpw", "password": "x",
        })
        self.assertEqual(resp.status_code, 410)

    def test_reset_password_already_used(self):
        PasswordResetToken.objects.create(
            token="usedpw",
            dateExpiration=timezone.now() + timedelta(hours=1),
            utilisateur=self.user,
            utilise=True,
        )
        resp = self._post_json("/api/auth/reset-password", {
            "token": "usedpw", "password": "x",
        })
        self.assertEqual(resp.status_code, 409)

    def test_reset_password_missing_fields(self):
        resp = self._post_json("/api/auth/reset-password", {"token": "x"})
        self.assertEqual(resp.status_code, 400)

    def test_me_success(self):
        resp = self.client.get("/api/auth/me", **self._auth_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user"]["email"], "jean@test.com")
        self.assertEqual(len(data["user"]["entreprises"]), 1)

    def test_me_no_auth(self):
        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 401)

    def test_me_expired_token(self):
        import jwt as pyjwt
        from django.conf import settings
        payload = {
            "sub": str(self.user.id),
            "iat": 1000000,
            "exp": 1000001,
        }
        token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
        resp = self.client.get(
            "/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(resp.status_code, 401)

    def test_me_invalid_token(self):
        resp = self.client.get(
            "/api/auth/me", HTTP_AUTHORIZATION="Bearer invalidtoken"
        )
        self.assertEqual(resp.status_code, 401)

    def test_switch_entreprise_success(self):
        resp = self._post_json(
            "/api/auth/switch-entreprise",
            {"entreprise_id": str(self.entreprise.id)},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access_token", resp.json())

    def test_switch_entreprise_not_member(self):
        other = Entreprise.objects.create(nom="Autre", adresse="Elsewhere")
        resp = self._post_json(
            "/api/auth/switch-entreprise",
            {"entreprise_id": str(other.id)},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 403)

    def test_switch_entreprise_missing_id(self):
        resp = self._post_json(
            "/api/auth/switch-entreprise", {}, **self._auth_header()
        )
        self.assertEqual(resp.status_code, 400)

    def test_current_entreprise_success(self):
        resp = self.client.get("/api/auth/current-entreprise", **self._auth_header())
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["entreprise"]["id"], str(self.entreprise.id))

    def test_current_entreprise_no_auth(self):
        resp = self.client.get("/api/auth/current-entreprise")
        self.assertEqual(resp.status_code, 401)

    def test_accept_invitation_success(self):
        import jwt as pyjwt
        from django.conf import settings
        from core.models import Invitation

        other_entreprise = Entreprise.objects.create(nom="InvCo", adresse="Here")
        TypeOffreModel.objects.get_or_create(value="Freemium", defaults={"titre": "Freemium"})
        inv = Invitation.objects.create(
            token="placeholder",
            rolePropose=RoleUtilisateur.APICULTEUR,
            dateExpiration=timezone.now() + timedelta(days=7),
            entreprise=other_entreprise,
            envoyeePar=self.user,
        )
        inv_token = pyjwt.encode(
            {"invitation_id": str(inv.id)},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        inv.token = inv_token
        inv.save()

        new_user = Utilisateur.objects.create(
            nom="Inv", prenom="User", email="inv@test.com",
            motDePasseHash=make_password("pass"), actif=True,
        )
        resp = self._post_json(
            "/api/auth/accept-invitation",
            {"token": inv_token},
            **self._auth_header(user=new_user, entreprise_id=str(self.entreprise.id)),
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(
            UtilisateurEntreprise.objects.filter(
                utilisateur=new_user, entreprise=other_entreprise
            ).exists()
        )

    def test_accept_invitation_expired(self):
        import jwt as pyjwt
        from django.conf import settings
        from core.models import Invitation

        other = Entreprise.objects.create(nom="ExpCo", adresse="Here")
        inv = Invitation.objects.create(
            token="placeholder",
            rolePropose=RoleUtilisateur.APICULTEUR,
            dateExpiration=timezone.now() - timedelta(days=1),
            entreprise=other,
            envoyeePar=self.user,
        )
        inv_token = pyjwt.encode(
            {"invitation_id": str(inv.id)},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        inv.token = inv_token
        inv.save()

        resp = self._post_json(
            "/api/auth/accept-invitation",
            {"token": inv_token},
            **self._auth_header(),
        )
        self.assertEqual(resp.status_code, 410)
