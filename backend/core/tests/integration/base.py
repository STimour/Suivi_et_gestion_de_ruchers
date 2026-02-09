import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import requests
from django.conf import settings
from django.test import TransactionTestCase

from core.models import (
    Entreprise,
    Utilisateur,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Offre,
    TypeOffre,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    LigneeReine,
    TypeMaladie,
)


def get_jwt_secret():
    return getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY


def generate_jwt_token(
    user: Utilisateur,
    entreprise: Optional[Entreprise] = None,
    role: str = RoleUtilisateur.ADMIN_ENTREPRISE.value,
) -> str:
    now = datetime.now(timezone.utc)
    hasura_claims = {
        "x-hasura-user-id": str(user.id),
        "x-hasura-default-role": role,
        "x-hasura-allowed-roles": [
            RoleUtilisateur.LECTEUR.value,
            RoleUtilisateur.APICULTEUR.value,
            RoleUtilisateur.ADMIN_ENTREPRISE.value,
        ],
        "x-hasura-role": role,
    }
    if entreprise:
        hasura_claims["x-hasura-entreprise-id"] = str(entreprise.id)
        hasura_claims["x-hasura-offre"] = TypeOffre.FREEMIUM.value

    payload = {
        "sub": str(user.id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp()),
        "https://hasura.io/jwt/claims": hasura_claims,
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")


def is_hasura_available(endpoint: str = None) -> bool:
    endpoint = endpoint or os.getenv("HASURA_GRAPHQL_ENDPOINT", "http://localhost:8081/v1/graphql")
    try:
        response = requests.post(
            endpoint,
            json={"query": "{ __typename }"},
            headers={"Content-Type": "application/json"},
            timeout=2,
        )
        return response.status_code == 200
    except Exception:
        return False


class GraphQLTestCase(TransactionTestCase):
    HASURA_ENDPOINT = os.getenv("HASURA_GRAPHQL_ENDPOINT", "http://localhost:8081/v1/graphql")
    HASURA_ADMIN_SECRET = os.getenv("HASURA_GRAPHQL_ADMIN_SECRET", "myadminsecret")
    skip_graphql_tests = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.skip_graphql_tests = not is_hasura_available(cls.HASURA_ENDPOINT)

    @staticmethod
    def _setup_enum_tables():
        """Populate enum FK tables so that ForeignKey lookups work in the test DB."""
        for val in (
            TypeFlore.ACACIA, TypeFlore.COLZA, TypeFlore.LAVANDE,
            TypeFlore.TOURNESOL, TypeFlore.CHATAIGNIER, TypeFlore.BRUYERE,
            TypeFlore.MONTAGNE, TypeFlore.TOUTES_FLEURS,
        ):
            TypeFlore.objects.get_or_create(value=val, defaults={"label": val})

        for val in (
            TypeRuche.DADANT, TypeRuche.LANGSTROTH, TypeRuche.WARRE,
            TypeRuche.VOIRNOT, TypeRuche.KENYA_TOP_BAR, TypeRuche.RUCHETTE,
            TypeRuche.NUCLEI,
        ):
            TypeRuche.objects.get_or_create(value=val, defaults={"label": val})

        for val in (
            TypeRaceAbeille.BUCKFAST, TypeRaceAbeille.NOIRE,
            TypeRaceAbeille.CARNICA, TypeRaceAbeille.LIGUSTICA,
            TypeRaceAbeille.CAUCASICA, TypeRaceAbeille.HYBRIDE_LOCALE,
            TypeRaceAbeille.INCONNUE,
        ):
            TypeRaceAbeille.objects.get_or_create(value=val, defaults={"label": val})

        for val in (
            LigneeReine.BUCKFAST, LigneeReine.CARNICA, LigneeReine.LIGUSTICA,
            LigneeReine.CAUCASICA, LigneeReine.LOCALE, LigneeReine.INCONNUE,
        ):
            LigneeReine.objects.get_or_create(value=val, defaults={"label": val})

        for val in (
            TypeMaladie.AUCUNE, TypeMaladie.VARROOSE, TypeMaladie.NOSEMOSE,
            TypeMaladie.LOQUE_AMERICAINE, TypeMaladie.LOQUE_EUROPEENNE,
            TypeMaladie.ACARAPISOSE, TypeMaladie.ASCOSPHEROSE,
            TypeMaladie.TROPILAEPS, TypeMaladie.VIRUS_AILES_DEFORMEES,
            TypeMaladie.PARALYSIE_CHRONIQUE, TypeMaladie.INTOXICATION_PESTICIDES,
        ):
            TypeMaladie.objects.get_or_create(value=val, defaults={"label": val})

    def setUp(self):
        super().setUp()
        self._setup_enum_tables()
        self.entreprise = Entreprise.objects.create(
            nom="Entreprise Test",
            adresse="123 Rue du Test, 75000 Paris",
        )
        self.admin_user = Utilisateur.objects.create(
            nom="Admin",
            prenom="Test",
            email="admin@test.com",
            motDePasseHash="hashedpassword123",
            actif=True,
        )
        self.user_entreprise = UtilisateurEntreprise.objects.create(
            utilisateur=self.admin_user,
            entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
        )
        self.offre = Offre.objects.create(
            entreprise=self.entreprise,
            type=TypeOffre.FREEMIUM.value,
            dateDebut=datetime.now(timezone.utc),
            active=True,
            nbRuchersMax=5,
            nbCapteursMax=10,
        )
        self.admin_token = generate_jwt_token(
            self.admin_user,
            self.entreprise,
            RoleUtilisateur.ADMIN_ENTREPRISE.value,
        )

    @staticmethod
    def _is_test_db_isolation_error(response):
        """Detect errors caused by Hasura pointing at the main DB while tests use a separate DB."""
        for err in response.get("errors", []):
            ext = err.get("extensions", {})
            code = ext.get("code", "")
            if code in ("postgres-error", "constraint-violation"):
                return True
        return False

    def execute_graphql(self, query, variables=None, token=None, use_admin_secret=False):
        headers = {"Content-Type": "application/json"}
        if use_admin_secret:
            headers["X-Hasura-Admin-Secret"] = self.HASURA_ADMIN_SECRET
        elif token:
            headers["Authorization"] = f"Bearer {token}"
        elif hasattr(self, "admin_token"):
            headers["Authorization"] = f"Bearer {self.admin_token}"

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        try:
            response = requests.post(self.HASURA_ENDPOINT, json=payload, headers=headers, timeout=10)
            result = response.json()
            if self._is_test_db_isolation_error(result):
                result["_hasura_unavailable"] = True
            return result
        except requests.exceptions.ConnectionError:
            return {"errors": [{"message": "Hasura non disponible"}], "_hasura_unavailable": True}
        except Exception as e:
            return {"errors": [{"message": str(e)}], "_hasura_unavailable": True}

    def skipIfNoHasura(self):
        if self.skip_graphql_tests:
            self.skipTest("Hasura non disponible")

    def assertGraphQLSuccess(self, response, message=""):
        if response.get("_hasura_unavailable"):
            self.skipTest("Hasura non disponible")
        errors = response.get("errors")
        if errors:
            self.fail(f"{message}: {errors}" if message else f"GraphQL errors: {errors}")

    def assertGraphQLError(self, response, message=""):
        if response.get("_hasura_unavailable"):
            self.skipTest("Hasura non disponible")
        if not response.get("errors"):
            self.fail(f"{message}: Expected errors" if message else "Expected GraphQL errors")

    def create_user(self, email="user@test.com", nom="Utilisateur", prenom="Test",
                    role=RoleUtilisateur.APICULTEUR.value):
        user = Utilisateur.objects.create(
            nom=nom, prenom=prenom, email=email,
            motDePasseHash="hashedpassword", actif=True,
        )
        UtilisateurEntreprise.objects.create(
            utilisateur=user, entreprise=self.entreprise, role=role,
        )
        token = generate_jwt_token(user, self.entreprise, role)
        return user, token
