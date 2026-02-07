import json

import jwt
from django.conf import settings
from django.http import JsonResponse

from core.models import Offre, TypeOffre


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
