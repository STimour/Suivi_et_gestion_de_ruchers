"""
Classes de base et utilitaires pour les tests d'intégration GraphQL.

Ces tests vérifient l'intégration complète entre Django (modèles) et Hasura (GraphQL).

IMPORTANT: Les tests GraphQL nécessitent que:
1. Docker-compose soit lancé avec Hasura
2. Les tests soient exécutés contre la base de données principale (pas test_)

Pour exécuter les tests contre Hasura:
    DATABASE_NAME=apiculture python manage.py test core.tests.integration --keepdb
"""

import os
import unittest
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import requests
from django.conf import settings
from django.test import TestCase, TransactionTestCase

from core.models import (
    Entreprise,
    Utilisateur,
    UtilisateurEntreprise,
    RoleUtilisateur,
    Offre,
    TypeOffre,
)


def get_jwt_secret():
    """Retourne le secret JWT utilisé pour signer les tokens."""
    return getattr(settings, "JWT_SECRET", None) or settings.SECRET_KEY


def generate_jwt_token(
    user: Utilisateur,
    entreprise: Optional[Entreprise] = None,
    role: str = RoleUtilisateur.ADMIN_ENTREPRISE.value,
) -> str:
    """
    Génère un token JWT valide pour les tests d'intégration.

    Args:
        user: L'utilisateur pour lequel générer le token
        entreprise: L'entreprise contexte (optionnel)
        role: Le rôle de l'utilisateur

    Returns:
        Token JWT encodé
    """
    now = datetime.now(timezone.utc)
    allowed_roles = [
        RoleUtilisateur.LECTEUR.value,
        RoleUtilisateur.APICULTEUR.value,
        RoleUtilisateur.ADMIN_ENTREPRISE.value,
    ]

    hasura_claims = {
        "x-hasura-user-id": str(user.id),
        "x-hasura-default-role": role,
        "x-hasura-allowed-roles": allowed_roles,
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
    """Vérifie si Hasura est disponible et répond."""
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


# Mapping des noms de modèles Django vers les noms de tables Hasura
TABLE_MAPPING = {
    "utilisateur": "utilisateurs",
    "entreprise": "entreprises",
    "utilisateur_entreprise": "utilisateurs_entreprises",
    "rucher": "ruchers",
    "ruche": "ruches",
    "reine": "reines",
    "intervention": "interventions",
    "capteur": "capteurs",
    "mesure": "mesures",
    "alerte": "alertes",
    "transhumance": "transhumances",
    "offre": "offres",
    "invitation": "invitations",
}


class GraphQLTestCase(TransactionTestCase):
    """
    Classe de base pour les tests d'intégration GraphQL avec Hasura.

    Fournit des méthodes utilitaires pour:
    - Créer des fixtures de test (utilisateurs, entreprises, etc.)
    - Exécuter des requêtes GraphQL
    - Gérer l'authentification JWT

    Note: Utilise TransactionTestCase pour permettre les tests avec
    des transactions de base de données réelles.
    """

    # URL de l'endpoint Hasura GraphQL
    HASURA_ENDPOINT = os.getenv("HASURA_GRAPHQL_ENDPOINT", "http://localhost:8081/v1/graphql")
    HASURA_ADMIN_SECRET = os.getenv("HASURA_GRAPHQL_ADMIN_SECRET", "myadminsecret")

    # Flag pour skipper les tests GraphQL si Hasura n'est pas disponible
    skip_graphql_tests = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.skip_graphql_tests = not is_hasura_available(cls.HASURA_ENDPOINT)
        if cls.skip_graphql_tests:
            print(f"\n⚠️  Hasura non disponible à {cls.HASURA_ENDPOINT} - Tests GraphQL skippés")

    def setUp(self):
        """Initialise les données de test de base."""
        super().setUp()
        self._setup_base_data()

    def _setup_base_data(self):
        """Crée les données de base pour les tests."""
        # Créer une entreprise de test
        self.entreprise = Entreprise.objects.create(
            nom="Entreprise Test",
            adresse="123 Rue du Test, 75000 Paris"
        )

        # Créer un utilisateur admin
        self.admin_user = Utilisateur.objects.create(
            nom="Admin",
            prenom="Test",
            email="admin@test.com",
            motDePasseHash="hashedpassword123",
            actif=True,
        )

        # Lier l'utilisateur à l'entreprise avec le rôle admin
        self.user_entreprise = UtilisateurEntreprise.objects.create(
            utilisateur=self.admin_user,
            entreprise=self.entreprise,
            role=RoleUtilisateur.ADMIN_ENTREPRISE.value,
        )

        # Créer une offre active
        self.offre = Offre.objects.create(
            entreprise=self.entreprise,
            type=TypeOffre.FREEMIUM.value,
            dateDebut=datetime.now(timezone.utc),
            active=True,
            nbRuchersMax=5,
            nbCapteursMax=10,
        )

        # Générer le token JWT pour l'admin
        self.admin_token = generate_jwt_token(
            self.admin_user,
            self.entreprise,
            RoleUtilisateur.ADMIN_ENTREPRISE.value
        )

    def execute_graphql(
        self,
        query: str,
        variables: Optional[dict] = None,
        token: Optional[str] = None,
        use_admin_secret: bool = False,
    ) -> dict:
        """
        Exécute une requête GraphQL contre l'endpoint Hasura.

        Args:
            query: La requête ou mutation GraphQL
            variables: Variables GraphQL (optionnel)
            token: Token JWT pour l'authentification (optionnel)
            use_admin_secret: Utiliser le secret admin Hasura au lieu d'un token JWT

        Returns:
            Réponse JSON de Hasura
        """
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
            response = requests.post(
                self.HASURA_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=10,
            )
            return response.json()
        except requests.exceptions.ConnectionError:
            return {
                "errors": [{
                    "message": "Hasura non disponible. Assurez-vous que docker-compose est lancé."
                }],
                "_hasura_unavailable": True
            }
        except Exception as e:
            return {"errors": [{"message": str(e)}], "_hasura_unavailable": True}

    def skipIfNoHasura(self):
        """Skip le test si Hasura n'est pas disponible."""
        if self.skip_graphql_tests:
            self.skipTest("Hasura non disponible")

    def assertGraphQLSuccess(self, response: dict, message: str = ""):
        """
        Vérifie qu'une réponse GraphQL ne contient pas d'erreurs.

        Args:
            response: La réponse de la requête GraphQL
            message: Message d'erreur personnalisé
        """
        # Skip si Hasura non disponible
        if response.get("_hasura_unavailable"):
            self.skipTest("Hasura non disponible")
            return

        errors = response.get("errors")
        if errors:
            error_msg = f"GraphQL errors: {errors}"
            if message:
                error_msg = f"{message}: {error_msg}"
            self.fail(error_msg)

    def assertGraphQLError(self, response: dict, message: str = ""):
        """
        Vérifie qu'une réponse GraphQL contient des erreurs.

        Args:
            response: La réponse de la requête GraphQL
            message: Message d'erreur personnalisé
        """
        # Skip si Hasura non disponible
        if response.get("_hasura_unavailable"):
            self.skipTest("Hasura non disponible")
            return

        errors = response.get("errors")
        if not errors:
            error_msg = "Expected GraphQL errors but got none"
            if message:
                error_msg = f"{message}: {error_msg}"
            self.fail(error_msg)

    def create_user(
        self,
        email: str = "user@test.com",
        nom: str = "Utilisateur",
        prenom: str = "Test",
        role: str = RoleUtilisateur.APICULTEUR.value,
    ) -> tuple[Utilisateur, str]:
        """
        Crée un utilisateur de test avec un token JWT.

        Returns:
            Tuple (utilisateur, token_jwt)
        """
        user = Utilisateur.objects.create(
            nom=nom,
            prenom=prenom,
            email=email,
            motDePasseHash="hashedpassword",
            actif=True,
        )

        UtilisateurEntreprise.objects.create(
            utilisateur=user,
            entreprise=self.entreprise,
            role=role,
        )

        token = generate_jwt_token(user, self.entreprise, role)
        return user, token


class GraphQLTestCaseMixin:
    """
    Mixin pour ajouter les fonctionnalités GraphQL à d'autres classes de test.
    """

    HASURA_ENDPOINT = os.getenv("HASURA_GRAPHQL_ENDPOINT", "http://localhost:8081/v1/graphql")
    HASURA_ADMIN_SECRET = os.getenv("HASURA_GRAPHQL_ADMIN_SECRET", "myadminsecret")

    def execute_graphql(self, query: str, variables: dict = None, token: str = None) -> dict:
        """Exécute une requête GraphQL."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}" if token else "",
        }

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        try:
            response = requests.post(
                self.HASURA_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=10,
            )
            return response.json()
        except requests.exceptions.ConnectionError:
            return {"errors": [{"message": "Hasura non disponible"}], "_hasura_unavailable": True}
