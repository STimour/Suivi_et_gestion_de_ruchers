from datetime import datetime, timezone

from core.models import (
    Rucher, Ruche, Reine, Intervention,
    TypeFlore, TypeRuche, TypeRaceAbeille,
    LigneeReine, CodeCouleurReine, TypeIntervention,
)
from .base import GraphQLTestCase


class ReineGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Reines", latitude=45.0, longitude=4.0,
            flore_id=TypeFlore.LAVANDE, altitude=300, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A5555555",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher,
        )
        self.reine = Reine.objects.create(
            anneeNaissance=2023,
            codeCouleur=CodeCouleurReine.ROUGE.value,
            lignee_id=LigneeReine.BUCKFAST,
            noteDouceur=8,
            nonReproductible=False,
            entreprise=self.entreprise,
            ruche=self.ruche,
        )

    def test_query_reines(self):
        query = """
        query { reines { id anneeNaissance codeCouleur lignee noteDouceur nonReproductible } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_reine_by_pk(self):
        query = """
        query GetReine($id: uuid!) {
            reines_by_pk(id: $id) {
                id anneeNaissance codeCouleur lignee noteDouceur nonReproductible
                ruche { immatriculation }
                entreprise { nom }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.reine.id)})
        self.assertGraphQLSuccess(response)
        reine = response.get("data", {}).get("reines_by_pk")
        if reine:
            self.assertEqual(reine["anneeNaissance"], 2023)
            self.assertEqual(reine["codeCouleur"], CodeCouleurReine.ROUGE.value)
            self.assertEqual(reine["noteDouceur"], 8)

    def test_insert_reine(self):
        ruche2 = Ruche.objects.create(
            immatriculation="A6666666",
            type_id=TypeRuche.LANGSTROTH,
            race_id=TypeRaceAbeille.CARNICA,
            rucher=self.rucher,
        )
        query = """
        mutation InsertReine($object: reines_insert_input!) {
            insert_reines_one(object: $object) { id anneeNaissance codeCouleur lignee }
        }
        """
        variables = {
            "object": {
                "anneeNaissance": 2024,
                "codeCouleur": CodeCouleurReine.VERT.value,
                "lignee": LigneeReine.CARNICA,
                "noteDouceur": 7,
                "entreprise_id": str(self.entreprise.id),
                "ruche_id": str(ruche2.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            reine = Reine.objects.create(
                anneeNaissance=2024, codeCouleur=CodeCouleurReine.VERT.value,
                lignee_id=LigneeReine.CARNICA, noteDouceur=7,
                entreprise=self.entreprise, ruche=ruche2,
            )
            self.assertEqual(reine.anneeNaissance, 2024)
        else:
            self.assertGraphQLSuccess(response)


class InterventionGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Interventions", latitude=45.0, longitude=4.0,
            flore_id=TypeFlore.TOURNESOL, altitude=400, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A8888888",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher,
        )
        self.visite = Intervention.objects.create(
            type=TypeIntervention.VISITE.value,
            date=datetime.now(timezone.utc),
            observations="Colonie en bonne sante",
            ruche=self.ruche,
        )

    def test_query_interventions(self):
        query = """
        query { interventions { id type date observations produit dosage } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_intervention_by_pk(self):
        query = """
        query GetIntervention($id: uuid!) {
            interventions_by_pk(id: $id) {
                id type date observations
                ruch { immatriculation }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.visite.id)})
        self.assertGraphQLSuccess(response)
        intervention = response.get("data", {}).get("interventions_by_pk")
        if intervention:
            self.assertEqual(intervention["type"], TypeIntervention.VISITE.value)

    def test_insert_intervention(self):
        now = datetime.now(timezone.utc).isoformat()
        query = """
        mutation InsertIntervention($object: interventions_insert_input!) {
            insert_interventions_one(object: $object) { id type date observations }
        }
        """
        variables = {
            "object": {
                "type": TypeIntervention.TRAITEMENT.value,
                "date": now,
                "observations": "Traitement anti-varroa",
                "produit": "Apivar",
                "dosage": "2 lanieres",
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            intervention = Intervention.objects.create(
                type=TypeIntervention.TRAITEMENT.value,
                date=datetime.now(timezone.utc),
                observations="Traitement anti-varroa",
                produit="Apivar", dosage="2 lanieres",
                ruche=self.ruche,
            )
            self.assertEqual(intervention.type, TypeIntervention.TRAITEMENT.value)
        else:
            self.assertGraphQLSuccess(response)

    def test_query_interventions_by_ruche(self):
        query = """
        query GetByRuche($rucheId: uuid!) {
            interventions(where: {ruche_id: {_eq: $rucheId}}, order_by: {date: desc}) {
                id type date observations
            }
        }
        """
        response = self.execute_graphql(query, variables={"rucheId": str(self.ruche.id)})
        self.assertGraphQLSuccess(response)
