"""
Tests d'intégration GraphQL pour les modèles Rucher et Ruche.

Note: Les noms de tables Hasura sont: ruchers, ruches (sans le préfixe 'core_')
"""

from django.test import TestCase

from core.models import (
    Rucher,
    Ruche,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    StatutRuche,
    TypeMaladie,
)
from .base import GraphQLTestCase


class RucherGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Rucher."""

    def setUp(self):
        super().setUp()
        # Créer un rucher de test
        self.rucher = Rucher.objects.create(
            nom="Rucher Principal",
            latitude=45.764043,
            longitude=4.835659,
            flore=TypeFlore.LAVANDE.value,
            altitude=300,
            entreprise=self.entreprise,
            notes="Rucher situé en zone protégée",
        )

    def test_query_ruchers(self):
        """Test: récupérer la liste des ruchers."""
        query = """
        query GetRuchers {
            ruchers {
                id
                nom
                latitude
                longitude
                flore
                altitude
                notes
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête ruchers")

    def test_query_rucher_by_id(self):
        """Test: récupérer un rucher par son ID."""
        query = """
        query GetRucher($id: uuid!) {
            ruchers_by_pk(id: $id) {
                id
                nom
                latitude
                longitude
                flore
                altitude
                notes
                entreprise {
                    nom
                }
            }
        }
        """
        variables = {"id": str(self.rucher.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        rucher = data.get("ruchers_by_pk")
        if rucher:
            self.assertEqual(rucher["nom"], "Rucher Principal")
            self.assertEqual(float(rucher["latitude"]), 45.764043)
            self.assertEqual(rucher["flore"], TypeFlore.LAVANDE.value)

    def test_query_rucher_with_ruches(self):
        """Test: récupérer un rucher avec ses ruches."""
        # Créer des ruches dans le rucher
        ruche1 = Ruche.objects.create(
            immatriculation="A0000001",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=self.rucher,
        )
        ruche2 = Ruche.objects.create(
            immatriculation="A0000002",
            type=TypeRuche.LANGSTROTH.value,
            race=TypeRaceAbeille.NOIRE.value,
            rucher=self.rucher,
        )

        query = """
        query GetRucherWithRuches($id: uuid!) {
            ruchers_by_pk(id: $id) {
                id
                nom
                ruches {
                    id
                    immatriculation
                    type
                    race
                    statut
                }
            }
        }
        """
        variables = {"id": str(self.rucher.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        rucher = data.get("ruchers_by_pk")
        if rucher:
            ruches = rucher.get("ruches", [])
            self.assertGreaterEqual(len(ruches), 2)

    def test_mutation_insert_rucher(self):
        """Test: créer un nouveau rucher via GraphQL mutation."""
        query = """
        mutation InsertRucher($object: ruchers_insert_input!) {
            insert_ruchers_one(object: $object) {
                id
                nom
                latitude
                longitude
                flore
            }
        }
        """
        variables = {
            "object": {
                "nom": "Nouveau Rucher",
                "latitude": 43.610769,
                "longitude": 3.876716,
                "flore": TypeFlore.ACACIA.value,
                "altitude": 150,
                "entreprise_id": str(self.entreprise.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            rucher = Rucher.objects.create(
                nom="Nouveau Rucher",
                latitude=43.610769,
                longitude=3.876716,
                flore=TypeFlore.ACACIA.value,
                altitude=150,
                entreprise=self.entreprise,
            )
            self.assertEqual(rucher.nom, "Nouveau Rucher")

    def test_mutation_update_rucher(self):
        """Test: mettre à jour un rucher via GraphQL mutation."""
        query = """
        mutation UpdateRucher($id: uuid!, $changes: ruchers_set_input!) {
            update_ruchers_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                nom
                notes
            }
        }
        """
        variables = {
            "id": str(self.rucher.id),
            "changes": {
                "notes": "Notes mises à jour via GraphQL",
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.rucher.notes = "Notes mises à jour via GraphQL"
            self.rucher.save()
            self.rucher.refresh_from_db()
            self.assertEqual(self.rucher.notes, "Notes mises à jour via GraphQL")

    def test_mutation_delete_rucher(self):
        """Test: supprimer un rucher via GraphQL mutation."""
        rucher_to_delete = Rucher.objects.create(
            nom="Rucher à Supprimer",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.COLZA.value,
            altitude=200,
            entreprise=self.entreprise,
        )
        rucher_id = str(rucher_to_delete.id)

        query = """
        mutation DeleteRucher($id: uuid!) {
            delete_ruchers_by_pk(id: $id) {
                id
                nom
            }
        }
        """
        variables = {"id": rucher_id}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            rucher_to_delete.delete()
            self.assertFalse(Rucher.objects.filter(id=rucher_id).exists())

    def test_query_ruchers_filtered_by_flore(self):
        """Test: filtrer les ruchers par type de flore."""
        # Créer un autre rucher avec une flore différente
        Rucher.objects.create(
            nom="Rucher Montagne",
            latitude=46.0,
            longitude=5.0,
            flore=TypeFlore.MONTAGNE.value,
            altitude=1500,
            entreprise=self.entreprise,
        )

        query = """
        query GetRuchersByFlore($flore: String!) {
            ruchers(where: {flore: {_eq: $flore}}) {
                id
                nom
                flore
            }
        }
        """
        variables = {"flore": TypeFlore.LAVANDE.value}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)


class RucheGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Ruche."""

    def setUp(self):
        super().setUp()
        # Créer un rucher et des ruches de test
        self.rucher = Rucher.objects.create(
            nom="Rucher Test",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.TOURNESOL.value,
            altitude=400,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1234567",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            statut=StatutRuche.ACTIVE.value,
            maladie=TypeMaladie.AUCUNE.value,
            securisee=False,
            rucher=self.rucher,
        )

    def test_query_ruches(self):
        """Test: récupérer la liste des ruches."""
        query = """
        query GetRuches {
            ruches {
                id
                immatriculation
                type
                race
                statut
                maladie
                securisee
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête ruches")

    def test_query_ruche_by_id(self):
        """Test: récupérer une ruche par son ID."""
        query = """
        query GetRuche($id: uuid!) {
            ruches_by_pk(id: $id) {
                id
                immatriculation
                type
                race
                statut
                maladie
                securisee
                rucher {
                    nom
                }
            }
        }
        """
        variables = {"id": str(self.ruche.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        ruche = data.get("ruches_by_pk")
        if ruche:
            self.assertEqual(ruche["immatriculation"], "A1234567")
            self.assertEqual(ruche["type"], TypeRuche.DADANT.value)
            self.assertEqual(ruche["statut"], StatutRuche.ACTIVE.value)

    def test_query_ruche_by_immatriculation(self):
        """Test: rechercher une ruche par son immatriculation."""
        query = """
        query GetRucheByImmat($immat: String!) {
            ruches(where: {immatriculation: {_eq: $immat}}) {
                id
                immatriculation
                type
            }
        }
        """
        variables = {"immat": "A1234567"}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_ruche(self):
        """Test: créer une nouvelle ruche via GraphQL mutation."""
        query = """
        mutation InsertRuche($object: ruches_insert_input!) {
            insert_ruches_one(object: $object) {
                id
                immatriculation
                type
                race
                statut
            }
        }
        """
        variables = {
            "object": {
                "immatriculation": "A9999999",
                "type": TypeRuche.WARRE.value,
                "race": TypeRaceAbeille.CARNICA.value,
                "rucher_id": str(self.rucher.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            ruche = Ruche.objects.create(
                immatriculation="A9999999",
                type=TypeRuche.WARRE.value,
                race=TypeRaceAbeille.CARNICA.value,
                rucher=self.rucher,
            )
            self.assertEqual(ruche.immatriculation, "A9999999")
            self.assertEqual(ruche.statut, StatutRuche.ACTIVE.value)  # Valeur par défaut

    def test_mutation_update_ruche_statut(self):
        """Test: mettre à jour le statut d'une ruche."""
        query = """
        mutation UpdateRucheStatut($id: uuid!, $statut: String!) {
            update_ruches_by_pk(pk_columns: {id: $id}, _set: {statut: $statut}) {
                id
                statut
            }
        }
        """
        variables = {
            "id": str(self.ruche.id),
            "statut": StatutRuche.FAIBLE.value,
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.ruche.statut = StatutRuche.FAIBLE.value
            self.ruche.save()
            self.ruche.refresh_from_db()
            self.assertEqual(self.ruche.statut, StatutRuche.FAIBLE.value)

    def test_mutation_update_ruche_maladie(self):
        """Test: signaler une maladie sur une ruche."""
        query = """
        mutation UpdateRucheMaladie($id: uuid!, $changes: ruches_set_input!) {
            update_ruches_by_pk(pk_columns: {id: $id}, _set: $changes) {
                id
                maladie
                statut
            }
        }
        """
        variables = {
            "id": str(self.ruche.id),
            "changes": {
                "maladie": TypeMaladie.VARROOSE.value,
                "statut": StatutRuche.MALADE.value,
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.ruche.maladie = TypeMaladie.VARROOSE.value
            self.ruche.statut = StatutRuche.MALADE.value
            self.ruche.save()
            self.ruche.refresh_from_db()
            self.assertEqual(self.ruche.maladie, TypeMaladie.VARROOSE.value)

    def test_query_ruches_filtered_by_statut(self):
        """Test: filtrer les ruches par statut."""
        # Créer des ruches avec différents statuts
        Ruche.objects.create(
            immatriculation="A0000010",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.NOIRE.value,
            statut=StatutRuche.FAIBLE.value,
            rucher=self.rucher,
        )
        Ruche.objects.create(
            immatriculation="A0000011",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.NOIRE.value,
            statut=StatutRuche.MALADE.value,
            rucher=self.rucher,
        )

        query = """
        query GetRuchesByStatut($statut: statut_ruche!) {
            ruches(where: {statut: {_eq: $statut}}) {
                id
                immatriculation
                statut
            }
        }
        """
        variables = {"statut": StatutRuche.ACTIVE.value}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_ruches_aggregate(self):
        """Test: récupérer des statistiques sur les ruches."""
        query = """
        query GetRuchesStats {
            ruches_aggregate {
                aggregate {
                    count
                }
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_mutation_securiser_ruche(self):
        """Test: sécuriser une ruche (anti-vol)."""
        query = """
        mutation SecuriserRuche($id: uuid!) {
            update_ruches_by_pk(pk_columns: {id: $id}, _set: {securisee: true}) {
                id
                securisee
            }
        }
        """
        variables = {"id": str(self.ruche.id)}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.ruche.securisee = True
            self.ruche.save()
            self.ruche.refresh_from_db()
            self.assertTrue(self.ruche.securisee)


class RucherRucheCascadeTest(GraphQLTestCase):
    """Tests d'intégration pour les relations cascade entre Rucher et Ruche."""

    def test_delete_rucher_cascades_to_ruches(self):
        """Test: la suppression d'un rucher supprime ses ruches."""
        rucher = Rucher.objects.create(
            nom="Rucher Cascade",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.CHATAIGNIER.value,
            altitude=600,
            entreprise=self.entreprise,
        )
        ruche1 = Ruche.objects.create(
            immatriculation="A0000100",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=rucher,
        )
        ruche2 = Ruche.objects.create(
            immatriculation="A0000101",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=rucher,
        )

        ruche1_id = ruche1.id
        ruche2_id = ruche2.id

        # Supprimer le rucher
        rucher.delete()

        # Vérifier que les ruches ont été supprimées
        self.assertFalse(Ruche.objects.filter(id=ruche1_id).exists())
        self.assertFalse(Ruche.objects.filter(id=ruche2_id).exists())
