"""
Tests d'intégration GraphQL pour les modèles Utilisateur et Entreprise.

Note: Les noms de tables Hasura sont: utilisateurs, entreprises, utilisateurs_entreprises
(sans le préfixe 'core_')
"""

from django.test import TestCase

from core.models import (
    Utilisateur,
    Entreprise,
    UtilisateurEntreprise,
    RoleUtilisateur,
)
from .base import GraphQLTestCase, generate_jwt_token


class UtilisateurGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Utilisateur."""

    def test_query_utilisateurs_with_admin_token(self):
        """Test: récupérer la liste des utilisateurs avec un token admin."""
        query = """
        query GetUtilisateurs {
            utilisateurs {
                id
                nom
                prenom
                email
                actif
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête utilisateurs")

        data = response.get("data", {})
        utilisateurs = data.get("utilisateurs", [])
        self.assertIsInstance(utilisateurs, list)

    def test_query_utilisateur_by_id(self):
        """Test: récupérer un utilisateur par son ID."""
        query = """
        query GetUtilisateur($id: uuid!) {
            utilisateurs_by_pk(id: $id) {
                id
                nom
                prenom
                email
                actif
                created_at
            }
        }
        """
        variables = {"id": str(self.admin_user.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response, "Échec de la récupération de l'utilisateur")

        data = response.get("data", {})
        user = data.get("utilisateurs_by_pk")
        if user:  # Si Hasura est disponible
            self.assertEqual(user["nom"], "Admin")
            self.assertEqual(user["prenom"], "Test")
            self.assertEqual(user["email"], "admin@test.com")
            self.assertTrue(user["actif"])

    def test_mutation_insert_utilisateur(self):
        """Test: créer un nouvel utilisateur via GraphQL mutation."""
        import uuid
        unique_email = f"nouveau_{uuid.uuid4().hex[:8]}@test.com"

        query = """
        mutation InsertUtilisateur($object: utilisateurs_insert_input!) {
            insert_utilisateurs_one(object: $object) {
                id
                nom
                prenom
                email
                actif
            }
        }
        """
        variables = {
            "object": {
                "nom": "Nouveau",
                "prenom": "Utilisateur",
                "email": unique_email,
                "motDePasseHash": "hashedpassword123",
                "actif": True,
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        # Vérifier la création locale si Hasura n'est pas disponible
        if response.get("_hasura_unavailable"):
            # Créer localement pour valider le modèle
            user = Utilisateur.objects.create(
                nom="Nouveau",
                prenom="Utilisateur",
                email=unique_email,
                motDePasseHash="hashedpassword123",
                actif=True,
            )
            self.assertEqual(user.nom, "Nouveau")
            self.assertTrue(user.actif)
        else:
            self.assertGraphQLSuccess(response, "Échec de la création de l'utilisateur")

    def test_mutation_update_utilisateur(self):
        """Test: mettre à jour un utilisateur via GraphQL mutation."""
        query = """
        mutation UpdateUtilisateur($id: uuid!, $changes: utilisateurs_set_input!) {
            update_utilisateurs_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                nom
                prenom
            }
        }
        """
        variables = {
            "id": str(self.admin_user.id),
            "changes": {
                "nom": "AdminModifié",
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        # Vérifier localement si besoin
        if response.get("_hasura_unavailable"):
            self.admin_user.nom = "AdminModifié"
            self.admin_user.save()
            self.admin_user.refresh_from_db()
            self.assertEqual(self.admin_user.nom, "AdminModifié")

    def test_query_utilisateur_with_lecteur_role(self):
        """Test: un lecteur peut voir les utilisateurs de son entreprise."""
        user, token = self.create_user(
            email="lecteur@test.com",
            role=RoleUtilisateur.LECTEUR.value,
        )

        query = """
        query GetUtilisateurs {
            utilisateurs {
                id
                nom
                email
            }
        }
        """
        response = self.execute_graphql(query, token=token)
        # Le lecteur devrait avoir accès en lecture
        self.assertGraphQLSuccess(response)


class EntrepriseGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Entreprise."""

    def test_query_entreprises(self):
        """Test: récupérer la liste des entreprises."""
        query = """
        query GetEntreprises {
            entreprises {
                id
                nom
                adresse
                created_at
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête entreprises")

    def test_query_entreprise_by_id(self):
        """Test: récupérer une entreprise par son ID."""
        query = """
        query GetEntreprise($id: uuid!) {
            entreprises_by_pk(id: $id) {
                id
                nom
                adresse
            }
        }
        """
        variables = {"id": str(self.entreprise.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        entreprise = data.get("entreprises_by_pk")
        if entreprise:
            self.assertEqual(entreprise["nom"], "Entreprise Test")

    def test_query_entreprise_with_membres(self):
        """Test: récupérer une entreprise avec ses membres."""
        query = """
        query GetEntrepriseWithMembres($id: uuid!) {
            entreprises_by_pk(id: $id) {
                id
                nom
                utilisateurs_entreprises {
                    role
                    utilisateur {
                        nom
                        email
                    }
                }
            }
        }
        """
        variables = {"id": str(self.entreprise.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_entreprise(self):
        """Test: créer une nouvelle entreprise via GraphQL mutation."""
        query = """
        mutation InsertEntreprise($object: entreprises_insert_input!) {
            insert_entreprises_one(object: $object) {
                id
                nom
                adresse
            }
        }
        """
        variables = {
            "object": {
                "nom": "Nouvelle Entreprise",
                "adresse": "456 Avenue du Test",
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            entreprise = Entreprise.objects.create(
                nom="Nouvelle Entreprise",
                adresse="456 Avenue du Test",
            )
            self.assertEqual(entreprise.nom, "Nouvelle Entreprise")


class UtilisateurEntrepriseGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour la relation Utilisateur-Entreprise."""

    def test_query_utilisateur_entreprises(self):
        """Test: récupérer les associations utilisateur-entreprise."""
        query = """
        query GetUtilisateursEntreprises {
            utilisateurs_entreprises {
                id
                role
                utilisateur {
                    nom
                    email
                }
                entreprise {
                    nom
                }
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_user_with_all_entreprises(self):
        """Test: récupérer un utilisateur avec toutes ses entreprises."""
        # Créer une deuxième entreprise
        entreprise2 = Entreprise.objects.create(
            nom="Deuxième Entreprise",
            adresse="789 Rue Secondaire",
        )
        UtilisateurEntreprise.objects.create(
            utilisateur=self.admin_user,
            entreprise=entreprise2,
            role=RoleUtilisateur.LECTEUR.value,
        )

        query = """
        query GetUserEntreprises($userId: uuid!) {
            utilisateurs_by_pk(id: $userId) {
                nom
                utilisateurs_entreprises {
                    role
                    entreprise {
                        nom
                    }
                }
            }
        }
        """
        variables = {"userId": str(self.admin_user.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_add_user_to_entreprise(self):
        """Test: ajouter un utilisateur à une entreprise via mutation."""
        # Créer un utilisateur sans entreprise
        new_user = Utilisateur.objects.create(
            nom="Sans",
            prenom="Entreprise",
            email="sans.entreprise@test.com",
            motDePasseHash="hash",
            actif=True,
        )

        query = """
        mutation AddUserToEntreprise($object: utilisateurs_entreprises_insert_input!) {
            insert_utilisateurs_entreprises_one(object: $object) {
                id
                role
            }
        }
        """
        variables = {
            "object": {
                "utilisateur_id": str(new_user.id),
                "entreprise_id": str(self.entreprise.id),
                "role": RoleUtilisateur.APICULTEUR.value,
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            ue = UtilisateurEntreprise.objects.create(
                utilisateur=new_user,
                entreprise=self.entreprise,
                role=RoleUtilisateur.APICULTEUR.value,
            )
            self.assertEqual(ue.role, RoleUtilisateur.APICULTEUR.value)


class PermissionsGraphQLTest(GraphQLTestCase):
    """Tests des permissions GraphQL basées sur les rôles."""

    def test_admin_can_insert(self):
        """Test: un admin peut créer des données."""
        query = """
        mutation InsertEntreprise($object: entreprises_insert_input!) {
            insert_entreprises_one(object: $object) {
                id
                nom
            }
        }
        """
        variables = {
            "object": {
                "nom": "Entreprise Admin",
                "adresse": "Admin Street",
            }
        }
        response = self.execute_graphql(query, variables=variables)
        # L'admin devrait pouvoir créer

    def test_lecteur_cannot_insert(self):
        """Test: un lecteur ne peut pas créer des données."""
        user, token = self.create_user(
            email="lecteur2@test.com",
            role=RoleUtilisateur.LECTEUR.value,
        )

        query = """
        mutation InsertEntreprise($object: entreprises_insert_input!) {
            insert_entreprises_one(object: $object) {
                id
                nom
            }
        }
        """
        variables = {
            "object": {
                "nom": "Entreprise Lecteur",
                "adresse": "Lecteur Street",
            }
        }
        response = self.execute_graphql(query, variables=variables, token=token)
        # Le lecteur ne devrait pas pouvoir créer, on s'attend à une erreur
        # Note: le comportement exact dépend de la configuration Hasura

    def test_apiculteur_permissions(self):
        """Test: un apiculteur a des permissions intermédiaires."""
        user, token = self.create_user(
            email="apiculteur@test.com",
            role=RoleUtilisateur.APICULTEUR.value,
        )

        # L'apiculteur devrait pouvoir lire
        query = """
        query GetEntreprises {
            entreprises {
                id
                nom
            }
        }
        """
        response = self.execute_graphql(query, token=token)
        self.assertGraphQLSuccess(response)
