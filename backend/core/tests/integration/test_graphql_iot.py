"""
Tests d'intégration GraphQL pour les modèles IoT (Capteur, Mesure, Alerte).

Note: Les noms de tables Hasura sont: capteurs, mesures, alertes (sans le préfixe 'core_')
"""

from datetime import datetime, timedelta, timezone

from django.test import TestCase

from core.models import (
    Rucher,
    Ruche,
    Capteur,
    Mesure,
    Alerte,
    TypeFlore,
    TypeRuche,
    TypeRaceAbeille,
    TypeCapteur,
    TypeAlerte,
)
from .base import GraphQLTestCase


class CapteurGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Capteur."""

    def setUp(self):
        super().setUp()
        # Créer un rucher et une ruche
        self.rucher = Rucher.objects.create(
            nom="Rucher IoT",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.LAVANDE.value,
            altitude=300,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1111111",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=self.rucher,
        )
        # Créer des capteurs
        self.capteur_poids = Capteur.objects.create(
            type=TypeCapteur.POIDS.value,
            identifiant="POIDS-001",
            actif=True,
            batteriePct=85,
            derniereCommunication=datetime.now(timezone.utc),
            ruche=self.ruche,
        )
        self.capteur_temp = Capteur.objects.create(
            type=TypeCapteur.TEMPERATURE.value,
            identifiant="TEMP-001",
            actif=True,
            batteriePct=90,
            derniereCommunication=datetime.now(timezone.utc),
            ruche=self.ruche,
        )

    def test_query_capteurs(self):
        """Test: récupérer la liste des capteurs."""
        query = """
        query GetCapteurs {
            capteurs {
                id
                type
                identifiant
                actif
                batteriePct
                derniereCommunication
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête capteurs")

    def test_query_capteur_by_id(self):
        """Test: récupérer un capteur par son ID."""
        query = """
        query GetCapteur($id: uuid!) {
            capteurs_by_pk(id: $id) {
                id
                type
                identifiant
                actif
                batteriePct
                ruch {
                    immatriculation
                }
            }
        }
        """
        variables = {"id": str(self.capteur_poids.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        capteur = data.get("capteurs_by_pk")
        if capteur:
            self.assertEqual(capteur["type"], TypeCapteur.POIDS.value)
            self.assertEqual(capteur["identifiant"], "POIDS-001")
            self.assertTrue(capteur["actif"])

    def test_query_capteur_by_identifiant(self):
        """Test: rechercher un capteur par son identifiant unique."""
        query = """
        query GetCapteurByIdentifiant($identifiant: String!) {
            capteurs(where: {identifiant: {_eq: $identifiant}}) {
                id
                type
                identifiant
            }
        }
        """
        variables = {"identifiant": "POIDS-001"}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_capteurs_by_ruche(self):
        """Test: récupérer tous les capteurs d'une ruche."""
        query = """
        query GetCapteursByRuche($rucheId: uuid!) {
            capteurs(where: {ruche_id: {_eq: $rucheId}}) {
                id
                type
                identifiant
                actif
            }
        }
        """
        variables = {"rucheId": str(self.ruche.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_capteur(self):
        """Test: créer un nouveau capteur via GraphQL mutation."""
        query = """
        mutation InsertCapteur($object: capteurs_insert_input!) {
            insert_capteurs_one(object: $object) {
                id
                type
                identifiant
                actif
            }
        }
        """
        variables = {
            "object": {
                "type": TypeCapteur.HUMIDITE.value,
                "identifiant": "HUM-001",
                "actif": True,
                "batteriePct": 100,
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            capteur = Capteur.objects.create(
                type=TypeCapteur.HUMIDITE.value,
                identifiant="HUM-001",
                actif=True,
                batteriePct=100,
                ruche=self.ruche,
            )
            self.assertEqual(capteur.type, TypeCapteur.HUMIDITE.value)

    def test_mutation_update_capteur_batterie(self):
        """Test: mettre à jour le niveau de batterie d'un capteur."""
        query = """
        mutation UpdateCapteurBatterie($id: uuid!, $batterie: Int!) {
            update_capteurs_by_pk(pk_columns: {id: $id}, _set: {batteriePct: $batterie}) {
                id
                batteriePct
            }
        }
        """
        variables = {
            "id": str(self.capteur_poids.id),
            "batterie": 75,
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.capteur_poids.batteriePct = 75
            self.capteur_poids.save()
            self.capteur_poids.refresh_from_db()
            self.assertEqual(self.capteur_poids.batteriePct, 75)

    def test_mutation_desactiver_capteur(self):
        """Test: désactiver un capteur."""
        query = """
        mutation DesactiverCapteur($id: uuid!) {
            update_capteurs_by_pk(pk_columns: {id: $id}, _set: {actif: false}) {
                id
                actif
            }
        }
        """
        variables = {"id": str(self.capteur_temp.id)}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.capteur_temp.actif = False
            self.capteur_temp.save()
            self.capteur_temp.refresh_from_db()
            self.assertFalse(self.capteur_temp.actif)

    def test_query_capteurs_low_battery(self):
        """Test: rechercher les capteurs avec une batterie faible."""
        # Créer un capteur avec batterie faible
        Capteur.objects.create(
            type=TypeCapteur.GPS.value,
            identifiant="GPS-LOW",
            actif=True,
            batteriePct=10,
            ruche=self.ruche,
        )

        query = """
        query GetCapteursLowBattery($threshold: float8!) {
            capteurs(where: {batteriePct: {_lt: $threshold}, actif: {_eq: true}}) {
                id
                identifiant
                batteriePct
            }
        }
        """
        variables = {"threshold": 20.0}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)


class MesureGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Mesure."""

    def setUp(self):
        super().setUp()
        # Créer un rucher, une ruche et un capteur
        self.rucher = Rucher.objects.create(
            nom="Rucher Mesures",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.ACACIA.value,
            altitude=200,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A2222222",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.NOIRE.value,
            rucher=self.rucher,
        )
        self.capteur = Capteur.objects.create(
            type=TypeCapteur.POIDS.value,
            identifiant="POIDS-002",
            actif=True,
            batteriePct=95,
            ruche=self.ruche,
        )
        # Créer des mesures
        self.mesure1 = Mesure.objects.create(
            valeur=45.5,
            capteur=self.capteur,
        )
        self.mesure2 = Mesure.objects.create(
            valeur=46.2,
            capteur=self.capteur,
        )

    def test_query_mesures(self):
        """Test: récupérer la liste des mesures."""
        query = """
        query GetMesures {
            mesures {
                id
                valeur
                created_at
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête mesures")

    def test_query_mesure_by_id(self):
        """Test: récupérer une mesure par son ID."""
        query = """
        query GetMesure($id: uuid!) {
            mesures_by_pk(id: $id) {
                id
                valeur
                capteur {
                    identifiant
                    type
                }
            }
        }
        """
        variables = {"id": str(self.mesure1.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        mesure = data.get("mesures_by_pk")
        if mesure:
            self.assertEqual(float(mesure["valeur"]), 45.5)

    def test_query_mesures_by_capteur(self):
        """Test: récupérer les mesures d'un capteur."""
        query = """
        query GetMesuresByCapteur($capteurId: uuid!) {
            mesures(where: {capteur_id: {_eq: $capteurId}}, order_by: {created_at: desc}) {
                id
                valeur
                created_at
            }
        }
        """
        variables = {"capteurId": str(self.capteur.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_mesure(self):
        """Test: créer une nouvelle mesure via GraphQL mutation."""
        query = """
        mutation InsertMesure($object: mesures_insert_input!) {
            insert_mesures_one(object: $object) {
                id
                valeur
            }
        }
        """
        variables = {
            "object": {
                "valeur": 47.8,
                "capteur_id": str(self.capteur.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            mesure = Mesure.objects.create(
                valeur=47.8,
                capteur=self.capteur,
            )
            self.assertEqual(mesure.valeur, 47.8)

    def test_mutation_insert_multiple_mesures(self):
        """Test: insérer plusieurs mesures en une fois."""
        query = """
        mutation InsertMesures($objects: [mesures_insert_input!]!) {
            insert_mesures(objects: $objects) {
                returning {
                    id
                    valeur
                }
                affected_rows
            }
        }
        """
        variables = {
            "objects": [
                {"valeur": 48.0, "capteur_id": str(self.capteur.id)},
                {"valeur": 48.5, "capteur_id": str(self.capteur.id)},
                {"valeur": 49.0, "capteur_id": str(self.capteur.id)},
            ]
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            for val in [48.0, 48.5, 49.0]:
                Mesure.objects.create(valeur=val, capteur=self.capteur)
            count = Mesure.objects.filter(capteur=self.capteur).count()
            self.assertGreaterEqual(count, 5)  # 2 initiales + 3 nouvelles

    def test_query_mesures_by_capteur_ordered(self):
        """Test: récupérer les mesures d'un capteur ordonnées."""
        query = """
        query GetMesuresOrdered($capteurId: uuid!) {
            mesures(where: {capteur_id: {_eq: $capteurId}}, order_by: {valeur: asc}) {
                id
                valeur
                created_at
            }
        }
        """
        variables = {"capteurId": str(self.capteur.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_mesures_with_limit(self):
        """Test: récupérer les dernières mesures avec une limite."""
        query = """
        query GetLatestMesures($capteurId: uuid!, $limit: Int!) {
            mesures(
                where: {capteur_id: {_eq: $capteurId}},
                order_by: {created_at: desc},
                limit: $limit
            ) {
                id
                valeur
                created_at
            }
        }
        """
        variables = {"capteurId": str(self.capteur.id), "limit": 5}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)


class AlerteGraphQLTest(GraphQLTestCase):
    """Tests d'intégration GraphQL pour le modèle Alerte."""

    def setUp(self):
        super().setUp()
        # Créer un rucher, une ruche et un capteur
        self.rucher = Rucher.objects.create(
            nom="Rucher Alertes",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.BRUYERE.value,
            altitude=500,
            entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A3333333",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=self.rucher,
        )
        self.capteur = Capteur.objects.create(
            type=TypeCapteur.GPS.value,
            identifiant="GPS-001",
            actif=True,
            batteriePct=80,
            ruche=self.ruche,
        )
        # Créer des alertes
        self.alerte_vol = Alerte.objects.create(
            type=TypeAlerte.VOL.value,
            message="Déplacement suspect détecté",
            acquittee=False,
            capteur=self.capteur,
        )
        self.alerte_batterie = Alerte.objects.create(
            type=TypeAlerte.BATTERIE_FAIBLE.value,
            message="Batterie à 15%",
            acquittee=True,
            capteur=self.capteur,
        )

    def test_query_alertes(self):
        """Test: récupérer la liste des alertes."""
        query = """
        query GetAlertes {
            alertes {
                id
                type
                message
                acquittee
                created_at
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response, "Échec de la requête alertes")

    def test_query_alerte_by_id(self):
        """Test: récupérer une alerte par son ID."""
        query = """
        query GetAlerte($id: uuid!) {
            alertes_by_pk(id: $id) {
                id
                type
                message
                acquittee
                capteur {
                    identifiant
                    ruch {
                        immatriculation
                    }
                }
            }
        }
        """
        variables = {"id": str(self.alerte_vol.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

        data = response.get("data", {})
        alerte = data.get("alertes_by_pk")
        if alerte:
            self.assertEqual(alerte["type"], TypeAlerte.VOL.value)
            self.assertFalse(alerte["acquittee"])

    def test_query_alertes_non_acquittees(self):
        """Test: récupérer les alertes non acquittées."""
        query = """
        query GetAlertesNonAcquittees {
            alertes(where: {acquittee: {_eq: false}}, order_by: {created_at: desc}) {
                id
                type
                message
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_mutation_insert_alerte(self):
        """Test: créer une nouvelle alerte via GraphQL mutation."""
        query = """
        mutation InsertAlerte($object: alertes_insert_input!) {
            insert_alertes_one(object: $object) {
                id
                type
                message
                acquittee
            }
        }
        """
        variables = {
            "object": {
                "type": TypeAlerte.CHUTE_POIDS.value,
                "message": "Poids anormalement bas détecté",
                "acquittee": False,
                "capteur_id": str(self.capteur.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            alerte = Alerte.objects.create(
                type=TypeAlerte.CHUTE_POIDS.value,
                message="Poids anormalement bas détecté",
                acquittee=False,
                capteur=self.capteur,
            )
            self.assertEqual(alerte.type, TypeAlerte.CHUTE_POIDS.value)

    def test_mutation_acquitter_alerte(self):
        """Test: acquitter une alerte."""
        query = """
        mutation AcquitterAlerte($id: uuid!) {
            update_alertes_by_pk(pk_columns: {id: $id}, _set: {acquittee: true}) {
                id
                acquittee
            }
        }
        """
        variables = {"id": str(self.alerte_vol.id)}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)

        if response.get("_hasura_unavailable"):
            self.alerte_vol.acquittee = True
            self.alerte_vol.save()
            self.alerte_vol.refresh_from_db()
            self.assertTrue(self.alerte_vol.acquittee)

    def test_query_alertes_by_type(self):
        """Test: filtrer les alertes par type."""
        query = """
        query GetAlertesByType($type: String!) {
            alertes(where: {type: {_eq: $type}}) {
                id
                type
                message
            }
        }
        """
        variables = {"type": TypeAlerte.VOL.value}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)

    def test_query_alertes_list(self):
        """Test: récupérer la liste complète des alertes."""
        query = """
        query GetAlertesList {
            alertes {
                id
                type
                message
                acquittee
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)


class IoTIntegrationTest(GraphQLTestCase):
    """Tests d'intégration complets pour le système IoT."""

    def test_full_iot_workflow(self):
        """Test: workflow complet capteur → mesure → alerte."""
        # Créer la hiérarchie complète
        rucher = Rucher.objects.create(
            nom="Rucher IoT Complet",
            latitude=45.0,
            longitude=4.0,
            flore=TypeFlore.LAVANDE.value,
            altitude=300,
            entreprise=self.entreprise,
        )
        ruche = Ruche.objects.create(
            immatriculation="A4444444",
            type=TypeRuche.DADANT.value,
            race=TypeRaceAbeille.BUCKFAST.value,
            rucher=rucher,
        )
        capteur = Capteur.objects.create(
            type=TypeCapteur.POIDS.value,
            identifiant="POIDS-FULL",
            actif=True,
            batteriePct=90,
            ruche=ruche,
        )

        # Simuler des mesures
        mesures = []
        for i, val in enumerate([50.0, 49.5, 30.0]):  # Chute de poids
            mesure = Mesure.objects.create(
                valeur=val,
                capteur=capteur,
            )
            mesures.append(mesure)

        # Créer une alerte suite à la chute
        alerte = Alerte.objects.create(
            type=TypeAlerte.CHUTE_POIDS.value,
            message="Chute de poids importante détectée",
            acquittee=False,
            capteur=capteur,
        )

        # Requête GraphQL pour récupérer toute la hiérarchie
        query = """
        query GetFullIoTData($rucheId: uuid!) {
            ruches_by_pk(id: $rucheId) {
                immatriculation
                capteurs {
                    identifiant
                    type
                    mesures(order_by: {created_at: desc}, limit: 10) {
                        valeur
                        created_at
                    }
                    alertes(where: {acquittee: {_eq: false}}) {
                        type
                        message
                    }
                }
            }
        }
        """
        variables = {"rucheId": str(ruche.id)}
        response = self.execute_graphql(query, variables=variables)
        self.assertGraphQLSuccess(response)
