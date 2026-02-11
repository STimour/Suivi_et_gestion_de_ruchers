import json

import jwt
from django.conf import settings
from django.http import JsonResponse
from django.middleware.csrf import CsrfViewMiddleware

from core.models import Offre, TypeOffre, Utilisateur


class ApiCsrfExemptMiddleware(CsrfViewMiddleware):
    """CSRF exemption for /api/ endpoints is safe: all API authentication uses
    JWT Bearer tokens (Authorization header), not session cookies.
    CSRF attacks only exploit cookie-based authentication, so CSRF protection
    is not applicable here."""

    def _should_skip(self, request):
        return request.path.startswith("/api/")

    def process_view(self, request, callback, callback_args, callback_kwargs):  # noqa: S4502
        if self._should_skip(request):
            return None  # NOSONAR - JWT Bearer auth, CSRF not applicable
        return super().process_view(request, callback, callback_args, callback_kwargs)


class FreemiumProfileLimitMiddleware:
    """
    Enforce that Freemium enterprises can only select one profile.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self._check_request(request)
        if response is not None:
            return response
        return self.get_response(request)

    def _check_request(self, request):
        if request.method not in ("POST", "PUT", "PATCH"):
            return None

        content_type = (request.content_type or "").lower()
        if "application/json" not in content_type:
            return None

        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

        profiles = body.get("typeProfiles")
        if not isinstance(profiles, list) or len(profiles) <= 1:
            return None

        entreprise_id = (
            body.get("entreprise_id")
            or body.get("entrepriseId")
            or self._entreprise_id_from_token(request)
        )

        # Creation d'entreprise: pas encore d'offre, mais Freemium par defaut
        if not entreprise_id and request.path.rstrip("/") == "/api/entreprise":
            type_offre = body.get("typeOffre")
            if isinstance(type_offre, str) and type_offre.strip().lower() == TypeOffre.PREMIUM.value.lower():
                return None
            return self._freemium_limit_response()

        if not entreprise_id:
            return None

        offre = (
            Offre.objects.filter(entreprise_id=entreprise_id, active=True)
            .order_by("-dateDebut")
            .first()
        )
        if not offre:
            return None

        if offre.type_id == TypeOffre.FREEMIUM.value:
            return self._freemium_limit_response()

        return None

    def _entreprise_id_from_token(self, request):
        auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
        if not auth:
            return None
        parts = auth.split(" ", 1)
        if len(parts) != 2:
            return None
        scheme, token = parts
        if scheme.lower() != "bearer" or not token:
            return None
        try:
            payload = jwt.decode(
                token,
                getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.InvalidTokenError:
            return None
        claims = payload.get("https://hasura.io/jwt/claims") or {}
        return claims.get("x-hasura-entreprise-id")

    def _freemium_limit_response(self):
        return JsonResponse(
            {
                "error": "freemium_profile_limit",
                "message": (
                    "Selectionne un seul profil pour continuer a utiliser l'offre Freemium, "
                    "sinon il faut passer a l'offre Premium."
                ),
            },
            status=400,
        )


class PremiumPaymentRequiredMiddleware:
    """
    Block access when a Premium subscription is unpaid (offre.active = False).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self._check_request(request)
        if response is not None:
            return response
        return self.get_response(request)

    def _check_request(self, request):
        path = request.path or ""
        if not path.startswith("/api/"):
            return None

        # Allow checkout + webhook + auth endpoints
        if path.startswith("/api/stripe/webhook"):
            return None
        if path.startswith("/api/entreprises/") and path.rstrip("/").endswith("/checkout/premium"):
            return None
        if path.startswith("/api/auth/"):
            return None

        entreprise_id = self._entreprise_id_from_token(request)
        if not entreprise_id:
            return None

        offre = (
            Offre.objects.filter(entreprise_id=entreprise_id)
            .order_by("-dateDebut")
            .first()
        )
        if not offre:
            return None

        if offre.type_id == TypeOffre.PREMIUM.value and not offre.active:
            return JsonResponse(
                {
                    "error": "payment_required",
                    "message": "Paiement Premium requis pour continuer.",
                },
                status=402,
            )

        return None

    def _entreprise_id_from_token(self, request):
        auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
        if not auth:
            return None
        parts = auth.split(" ", 1)
        if len(parts) != 2:
            return None
        scheme, token = parts
        if scheme.lower() != "bearer" or not token:
            return None
        try:
            payload = jwt.decode(
                token,
                getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.InvalidTokenError:
            return None
        claims = payload.get("https://hasura.io/jwt/claims") or {}
        return claims.get("x-hasura-entreprise-id")


class AccountVerificationRequiredMiddleware:
    """
    Block access for inactive users (actif = False) when a Bearer token is provided.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self._check_request(request)
        if response is not None:
            return response
        return self.get_response(request)

    def _check_request(self, request):
        path = request.path or ""
        if not path.startswith("/api/"):
            return None

        # Allow registration + validation endpoints
        if path.startswith("/api/auth/register"):
            return None
        if path.startswith("/api/auth/verify-account"):
            return None
        if path.startswith("/api/auth/request-password-reset"):
            return None
        if path.startswith("/api/auth/reset-password"):
            return None

        token = self._bearer_token(request)
        if not token:
            return None

        try:
            payload = jwt.decode(
                token,
                getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.InvalidTokenError:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        try:
            user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return None

        if not user.actif:
            return JsonResponse(
                {
                    "error": "account_not_verified",
                    "message": "Veuillez valider votre compte pour continuer.",
                },
                status=403,
            )

        return None

    def _bearer_token(self, request):
        auth = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
        if not auth:
            return None
        parts = auth.split(" ", 1)
        if len(parts) != 2:
            return None
        scheme, token = parts
        if scheme.lower() != "bearer" or not token:
            return None
        return token
