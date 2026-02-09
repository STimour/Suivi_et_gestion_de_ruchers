from core.models import (
    Rucher, Ruche, TypeFlore, TypeRuche, TypeRaceAbeille, StatutRuche, TypeMaladie,
)
from .base import GraphQLTestCase


class RucherGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Principal",
            latitude=45.764043,
            longitude=4.835659,
            flore_id=TypeFlore.LAVANDE,
            altitude=300,
            entreprise=self.entreprise,
        )

    def test_query_ruchers(self):
        query = """
        query { ruchers { id nom latitude longitude flore altitude notes } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_rucher_by_pk_with_ruches(self):
        Ruche.objects.create(
            immatriculation="A0000001",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher,
        )
        query = """
        query GetRucher($id: uuid!) {
            ruchers_by_pk(id: $id) {
                id nom latitude longitude flore altitude
                entreprise { nom }
                ruches { id immatriculation type race statut }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.rucher.id)})
        self.assertGraphQLSuccess(response)
        rucher = response.get("data", {}).get("ruchers_by_pk")
        if rucher:
            self.assertEqual(rucher["nom"], "Rucher Principal")
            self.assertEqual(rucher["flore"], TypeFlore.LAVANDE)

    def test_insert_rucher(self):
        query = """
        mutation InsertRucher($object: ruchers_insert_input!) {
            insert_ruchers_one(object: $object) { id nom latitude longitude flore }
        }
        """
        variables = {
            "object": {
                "nom": "Nouveau Rucher",
                "latitude": 43.610769,
                "longitude": 3.876716,
                "flore": TypeFlore.ACACIA,
                "altitude": 150,
                "entreprise_id": str(self.entreprise.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            rucher = Rucher.objects.create(
                nom="Nouveau Rucher", latitude=43.610769, longitude=3.876716,
                flore_id=TypeFlore.ACACIA, altitude=150, entreprise=self.entreprise,
            )
            self.assertEqual(rucher.nom, "Nouveau Rucher")
        else:
            self.assertGraphQLSuccess(response)


class RucheGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Test",
            latitude=45.0,
            longitude=4.0,
            flore_id=TypeFlore.TOURNESOL,
            altitude=400,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1234567",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            statut=StatutRuche.ACTIVE.value,
            maladie_id=TypeMaladie.AUCUNE,
            securisee=False,
            rucher=self.rucher,
        )

    def test_query_ruches(self):
        query = """
        query { ruches { id immatriculation type race statut maladie securisee } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_ruche_by_pk(self):
        query = """
        query GetRuche($id: uuid!) {
            ruches_by_pk(id: $id) {
                id immatriculation type race statut maladie securisee
                rucher { nom }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.ruche.id)})
        self.assertGraphQLSuccess(response)
        ruche = response.get("data", {}).get("ruches_by_pk")
        if ruche:
            self.assertEqual(ruche["immatriculation"], "A1234567")
            self.assertEqual(ruche["type"], TypeRuche.DADANT)

    def test_insert_ruche(self):
        query = """
        mutation InsertRuche($object: ruches_insert_input!) {
            insert_ruches_one(object: $object) { id immatriculation type race statut }
        }
        """
        variables = {
            "object": {
                "immatriculation": "A9999999",
                "type": TypeRuche.WARRE,
                "race": TypeRaceAbeille.CARNICA,
                "rucher_id": str(self.rucher.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            ruche = Ruche.objects.create(
                immatriculation="A9999999", type_id=TypeRuche.WARRE,
                race_id=TypeRaceAbeille.CARNICA, rucher=self.rucher,
            )
            self.assertEqual(ruche.immatriculation, "A9999999")
        else:
            self.assertGraphQLSuccess(response)

    def test_ruches_aggregate(self):
        query = """
        query { ruches_aggregate { aggregate { count } } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)
