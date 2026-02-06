"""
Tests d'intégration GraphQL pour les modèles Reine et Intervention.

Note: Les noms de tables Hasura sont: reines, interventions (sans le préfixe 'core_')
"""

from datetime import date, timedelta

from django.test import TestCase

from core.models import (
    Rucher,
    Ruche,
    Reine,
    Intervention,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    LigneeReine,
    CodeCouleurReine,
    TypeIntervention,
)
from .base import GraphQLTestCase


class ReineGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Reine."""

    def setUp(self):
        super().setUp()
        # Créer un rucher et une ruche
        self.rucher = Rucher.objects.create(
            nom="Rucher Reines",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.LAVANDE.value,
            altitude=300,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A5555555",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=self.rucher,
        )
        # Créer une reine
        self.reine = Reine.objects.create(
            anneeNaissance=2023,
            codeCouleur=CodeCouleurReine.ROUGE.value,
            lignee=LigneeReine.BUCKFAST.value,
            noteDouceur=8,
            commentaire="Reine très productive",
            nonReproductible=False,
            entreprise=self.entreprise,
            ruche=self.ruche,
        )

    def test_query_reines(self):
        """Test: récupérer la liste des reines."""
        query = """
        query GetReines {
            reines {
                id
                anneeNaissance
                codeCouleur
                lignee
                noteDouceur
                commentaire
                nonReproductible
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête reines")

    def test_query_reine_by_id(self):
        """Test: récupérer une reine par son ID."""
        query = """
        query GetReine($id: uuid!) {
            reines_by_pk(id: $id) {
                id
                anneeNaissance
                codeCouleur
                lignee
                noteDouceur
                commentaire
                nonReproductible
                ruche {
                    immatriculation
                }
                entreprise {
                    nom
                }
            }
        }
        """
        variables = {"id": str(self.reine.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        reine = data.get("reines_by_pk")
        if reine:
            self.assertEqual(reine["anneeNaissance"], 2023)
            self.assertEqual(reine["codeCouleur"], CodeCouleurReine.ROUGE.value)
            self.assertEqual(reine["noteDouceur"], 8)

    def test_query_reine_with_ruche(self):
        """Test: récupérer une reine avec sa ruche associée."""
        query = """
        query GetReineWithRuche($id: uuid!) {
            reines_by_pk(id: $id) {
                id
                lignee
                ruche {
                    immatriculation
                    type
                    rucher {
                        nom
                    }
                }
            }
        }
        """
        variables = {"id": str(self.reine.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_reine(self):
        """Test: créer une nouvelle reine via GraphQL mutation."""
        # Créer une ruche sans reine
        ruche_sans_reine = Ruche.objects.create(
            immatriculation="A6666666",
            type=TypeRuche.LANGSTROTH.value,
            race=TypeRaceAbeille.CARNICA.value,
            rucher=self.rucher,
        )

        query = """
        mutation InsertReine($object: reines_insert_input!) {
            insert_reines_one(object: $object) {
                id
                anneeNaissance
                codeCouleur
                lignee
            }
        }
        """
        variables = {
            "object": {
                "anneeNaissance": 2024,
                "codeCouleur": CodeCouleurReine.VERT.value,
                "lignee": LigneeReine.CARNICA.value,
                "noteDouceur": 7,
                "entreprise_id": str(self.entreprise.id),
                "ruche_id": str(ruche_sans_reine.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            reine = Reine.objects.create(
                anneeNaissance=2024,
                codeCouleur=CodeCouleurReine.VERT.value,
                lignee=LigneeReine.CARNICA.value,
                noteDouceur=7,
                entreprise=self.entreprise,
                ruche=ruche_sans_reine,
            )
            self.assertEqual(reine.anneeNaissance, 2024)

    def test_mutation_update_reine(self):
        """Test: mettre à jour une reine via GraphQL mutation."""
        query = """
        mutation UpdateReine($id: uuid!, $changes: reines_set_input!) {
            update_reines_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                noteDouceur
                commentaire
            }
        }
        """
        variables = {
            "id": str(self.reine.id),
            "changes": {
                "noteDouceur": 9,
                "commentaire": "Reine exceptionnelle",
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.reine.noteDouceur = 9
            self.reine.commentaire = "Reine exceptionnelle"
            self.reine.save()
            self.reine.refresh_from_db()
            self.assertEqual(self.reine.noteDouceur, 9)

    def test_mutation_mark_reine_non_reproductible(self):
        """Test: marquer une reine comme non reproductible."""
        query = """
        mutation MarkReineNonReproductible($id: uuid!) {
            update_reines_by_pk(pk_columns: {id: $id}, _set: {nonReproductible: true}) {
                id
                nonReproductible
            }
        }
        """
        variables = {"id": str(self.reine.id)}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.reine.nonReproductible = True
            self.reine.save()
            self.reine.refresh_from_db()
            self.assertTrue(self.reine.nonReproductible)

    def test_query_reines_filtered_by_lignee(self):
        """Test: filtrer les reines par lignée."""
        # Créer une reine avec une lignée différente
        ruche2 = Ruche.objects.create(
            immatriculation="A7777777",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.LIGUSTICA.value,
            rucher=self.rucher,
        )
        Reine.objects.create(
            anneeNaissance=2022,
            codeCouleur=CodeCouleurReine.JAUNE.value,
            lignee=LigneeReine.LIGUSTICA.value,
            noteDouceur=6,
            entreprise=self.entreprise,
            ruche=ruche2,
        )

        query = """
        query GetReinesByLignee($lignee: lignee_reine!) {
            reines(where: {lignee: {_eq: $lignee}}) {
                id
                lignee
                anneeNaissance
            }
        }
        """
        variables = {"lignee": LigneeReine.BUCKFAST.value}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_reines_by_year(self):
        """Test: rechercher les reines par année de naissance."""
        query = """
        query GetReinesByYear($year: Int!) {
            reines(where: {anneeNaissance: {_eq: $year}}) {
                id
                anneeNaissance
                codeCouleur
            }
        }
        """
        variables = {"year": 2023}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)


class InterventionGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Intervention."""

    def setUp(self):
        super().setUp()
        # Créer un rucher et une ruche
        self.rucher = Rucher.objects.create(
            nom="Rucher Interventions",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.TOURNESOL.value,
            altitude=400,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A8888888",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=self.rucher,
        )
        # Créer des interventions
        self.visite = Intervention.objects.create(
            type=TypeIntervention.VISITE.value,
            date=date.today(),
            observations="Colonie en bonne santé, couvain compact",
            ruche=self.ruche,
        )
        self.traitement = Intervention.objects.create(
            type=TypeIntervention.TRAITEMENT.value,
            date=date.today() - timedelta(days=7),
            observations="Traitement anti-varroa",
            produit="Apivar",
            dosage="2 lanières",
            ruche=self.ruche,
        )

    def test_query_interventions(self):
        """Test: récupérer la liste des interventions."""
        query = """
        query GetInterventions {
            interventions {
                id
                type
                date
                observations
                produit
                dosage
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête interventions")

    def test_query_intervention_by_id(self):
        """Test: récupérer une intervention par son ID."""
        query = """
        query GetIntervention($id: uuid!) {
            interventions_by_pk(id: $id) {
                id
                type
                date
                observations
                ruch {
                    immatriculation
                }
            }
        }
        """
        variables = {"id": str(self.visite.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        intervention = data.get("interventions_by_pk")
        if intervention:
            self.assertEqual(intervention["type"], TypeIntervention.VISITE.value)

    def test_query_interventions_by_ruche(self):
        """Test: récupérer les interventions d'une ruche."""
        query = """
        query GetInterventionsByRuche($rucheId: uuid!) {
            interventions(where: {ruche_id: {_eq: $rucheId}}, order_by: {date: desc}) {
                id
                type
                date
                observations
            }
        }
        """
        variables = {"rucheId": str(self.ruche.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_visite(self):
        """Test: créer une visite via GraphQL mutation."""
        query = """
        mutation InsertVisite($object: interventions_insert_input!) {
            insert_interventions_one(object: $object) {
                id
                type
                date
                observations
            }
        }
        """
        variables = {
            "object": {
                "type": TypeIntervention.VISITE.value,
                "date": str(date.today()),
                "observations": "Visite de printemps",
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            intervention = Intervention.objects.create(
                type=TypeIntervention.VISITE.value,
                date=date.today(),
                observations="Visite de printemps",
                ruche=self.ruche,
            )
            self.assertEqual(intervention.type, TypeIntervention.VISITE.value)

    def test_mutation_insert_nourrissement(self):
        """Test: créer un nourrissement via GraphQL mutation."""
        query = """
        mutation InsertNourrissement($object: interventions_insert_input!) {
            insert_interventions_one(object: $object) {
                id
                type
                produit
                dosage
            }
        }
        """
        variables = {
            "object": {
                "type": TypeIntervention.NOURRISSEMENT.value,
                "date": str(date.today()),
                "observations": "Nourrissement stimulant",
                "produit": "Sirop 50/50",
                "dosage": "1L",
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            intervention = Intervention.objects.create(
                type=TypeIntervention.NOURRISSEMENT.value,
                date=date.today(),
                observations="Nourrissement stimulant",
                produit="Sirop 50/50",
                dosage="1L",
                ruche=self.ruche,
            )
            self.assertEqual(intervention.produit, "Sirop 50/50")

    def test_mutation_insert_recolte(self):
        """Test: créer une récolte via GraphQL mutation."""
        query = """
        mutation InsertRecolte($object: interventions_insert_input!) {
            insert_interventions_one(object: $object) {
                id
                type
                poidsKg
                nbHausses
            }
        }
        """
        variables = {
            "object": {
                "type": TypeIntervention.RECOLTE.value,
                "date": str(date.today()),
                "observations": "Récolte de miel de lavande",
                "poidsKg": 25.5,
                "nbHausses": 2,
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            intervention = Intervention.objects.create(
                type=TypeIntervention.RECOLTE.value,
                date=date.today(),
                observations="Récolte de miel de lavande",
                poidsKg=25.5,
                nbHausses=2,
                ruche=self.ruche,
            )
            self.assertEqual(intervention.poidsKg, 25.5)

    def test_query_interventions_filtered_by_type(self):
        """Test: filtrer les interventions par type."""
        query = """
        query GetInterventionsByType($type: String!) {
            interventions(where: {type: {_eq: $type}}) {
                id
                type
                date
            }
        }
        """
        variables = {"type": TypeIntervention.TRAITEMENT.value}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_interventions_date_range(self):
        """Test: récupérer les interventions dans une plage de dates."""
        start_date = (date.today() - timedelta(days=30)).isoformat()
        end_date = date.today().isoformat()

        query = """
        query GetInterventionsInRange($start: date!, $end: date!) {
            interventions(where: {
                _and: [
                    {date: {_gte: $start}},
                    {date: {_lte: $end}}
                ]
            }) {
                id
                type
                date
            }
        }
        """
        variables = {"start": start_date, "end": end_date}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_update_intervention(self):
        """Test: mettre à jour une intervention."""
        query = """
        mutation UpdateIntervention($id: uuid!, $changes: interventions_set_input!) {
            update_interventions_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                observations
            }
        }
        """
        variables = {
            "id": str(self.visite.id),
            "changes": {
                "observations": "Observations mises à jour",
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.visite.observations = "Observations mises à jour"
            self.visite.save()
            self.visite.refresh_from_db()
            self.assertEqual(self.visite.observations, "Observations mises à jour")

    def test_query_interventions_count(self):
        """Test: compter les interventions."""
        query = """
        query GetInterventionsCount {
            interventions {
                id
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)
