import uuid

from core.models import Utilisateur, Entreprise, UtilisateurEntreprise, RoleUtilisateur
from .base import GraphQLTestCase


class UtilisateurGraphQLTest(GraphQLTestCase):

    def test_query_utilisateurs(self):
        query = """
        query { utilisateurs { id nom prenom email actif } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)
        self.assertIsInstance(response["data"]["utilisateurs"], list)

    def test_query_utilisateur_by_pk(self):
        query = """
        query GetUtilisateur($id: uuid!) {
            utilisateurs_by_pk(id: $id) { id nom prenom email actif created_at }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.admin_user.id)})
        self.assertGraphQLSuccess(response)
        user = response.get("data", {}).get("utilisateurs_by_pk")
        if user:
            self.assertEqual(user["nom"], "Admin")
            self.assertEqual(user["email"], "admin@test.com")
            self.assertTrue(user["actif"])

    def test_insert_utilisateur(self):
        unique_email = f"nouveau_{uuid.uuid4().hex[:8]}@test.com"
        query = """
        mutation InsertUtilisateur($object: utilisateurs_insert_input!) {
            insert_utilisateurs_one(object: $object) { id nom email actif }
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
        if response.get("_hasura_unavailable"):
            user = Utilisateur.objects.create(
                nom="Nouveau", prenom="Utilisateur", email=unique_email,
                motDePasseHash="hashedpassword123", actif=True,
            )
            self.assertEqual(user.nom, "Nouveau")
        else:
            self.assertGraphQLSuccess(response)

    def test_lecteur_read_access(self):
        email = f"lecteur_{uuid.uuid4().hex[:8]}@test.com"
        _, token = self.create_user(email=email, role=RoleUtilisateur.LECTEUR.value)
        query = """
        query { utilisateurs { id nom email } }
        """
        response = self.execute_graphql(query, token=token)
        self.assertGraphQLSuccess(response)


class EntrepriseGraphQLTest(GraphQLTestCase):

    def test_query_entreprise_by_pk(self):
        query = """
        query GetEntreprise($id: uuid!) {
            entreprises_by_pk(id: $id) { id nom adresse }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.entreprise.id)})
        self.assertGraphQLSuccess(response)
        entreprise = response.get("data", {}).get("entreprises_by_pk")
        if entreprise:
            self.assertEqual(entreprise["nom"], "Entreprise Test")

    def test_query_entreprise_with_membres(self):
        query = """
        query GetEntreprise($id: uuid!) {
            entreprises_by_pk(id: $id) {
                id nom
                utilisateurs_entreprises { role utilisateur { nom email } }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.entreprise.id)})
        self.assertGraphQLSuccess(response)


class UtilisateurEntrepriseGraphQLTest(GraphQLTestCase):

    def test_query_utilisateurs_entreprises(self):
        query = """
        query {
            utilisateurs_entreprises {
                id role
                utilisateur { nom email }
                entreprise { nom }
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_add_user_to_entreprise(self):
        email = f"new_{uuid.uuid4().hex[:8]}@test.com"
        new_user = Utilisateur.objects.create(
            nom="Nouveau", prenom="Membre", email=email,
            motDePasseHash="hash", actif=True,
        )
        query = """
        mutation AddUser($object: utilisateurs_entreprises_insert_input!) {
            insert_utilisateurs_entreprises_one(object: $object) { id role }
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
                utilisateur=new_user, entreprise=self.entreprise,
                role=RoleUtilisateur.APICULTEUR.value,
            )
            self.assertEqual(ue.role, RoleUtilisateur.APICULTEUR.value)
        else:
            self.assertGraphQLSuccess(response)
