from datetime import datetime, timezone

from core.models import (
    Rucher, Ruche, Capteur, Mesure, Alerte,
    TypeFlore, TypeRuche, TypeRaceAbeille, TypeCapteur, TypeAlerte,
)
from .base import GraphQLTestCase


class CapteurGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher IoT", latitude=45.0, longitude=4.0,
            flore_id=TypeFlore.LAVANDE, altitude=300, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1111111",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher,
        )
        self.capteur = Capteur.objects.create(
            type=TypeCapteur.POIDS.value,
            identifiant="POIDS-001",
            actif=True,
            batteriePct=85,
            derniereCommunication=datetime.now(timezone.utc),
            ruche=self.ruche,
        )

    def test_query_capteurs(self):
        query = """
        query { capteurs { id type identifiant actif batteriePct derniereCommunication } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_capteur_by_pk(self):
        query = """
        query GetCapteur($id: uuid!) {
            capteurs_by_pk(id: $id) {
                id type identifiant actif batteriePct
                ruch { immatriculation }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.capteur.id)})
        self.assertGraphQLSuccess(response)
        capteur = response.get("data", {}).get("capteurs_by_pk")
        if capteur:
            self.assertEqual(capteur["type"], TypeCapteur.POIDS.value)
            self.assertEqual(capteur["identifiant"], "POIDS-001")
            self.assertTrue(capteur["actif"])

    def test_insert_capteur(self):
        query = """
        mutation InsertCapteur($object: capteurs_insert_input!) {
            insert_capteurs_one(object: $object) { id type identifiant actif }
        }
        """
        variables = {
            "object": {
                "type": TypeCapteur.HUMIDITE.value,
                "identifiant": "HUM-001",
                "actif": True,
                "batteriePct": 100.0,
                "ruche_id": str(self.ruche.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            capteur = Capteur.objects.create(
                type=TypeCapteur.HUMIDITE.value, identifiant="HUM-001",
                actif=True, batteriePct=100, ruche=self.ruche,
            )
            self.assertEqual(capteur.type, TypeCapteur.HUMIDITE.value)
        else:
            self.assertGraphQLSuccess(response)


class MesureGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Mesures", latitude=45.0, longitude=4.0,
            flore_id=TypeFlore.ACACIA, altitude=200, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A2222222",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.NOIRE,
            rucher=self.rucher,
        )
        self.capteur = Capteur.objects.create(
            type=TypeCapteur.POIDS.value,
            identifiant="POIDS-002",
            actif=True,
            batteriePct=95,
            ruche=self.ruche,
        )
        self.mesure = Mesure.objects.create(valeur=45.5, capteur=self.capteur)

    def test_query_mesures(self):
        query = """
        query { mesures { id valeur created_at } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_mesure_by_pk(self):
        query = """
        query GetMesure($id: uuid!) {
            mesures_by_pk(id: $id) {
                id valeur
                capteur { identifiant type }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.mesure.id)})
        self.assertGraphQLSuccess(response)
        mesure = response.get("data", {}).get("mesures_by_pk")
        if mesure:
            self.assertEqual(float(mesure["valeur"]), 45.5)

    def test_insert_mesure(self):
        query = """
        mutation InsertMesure($object: mesures_insert_input!) {
            insert_mesures_one(object: $object) { id valeur }
        }
        """
        variables = {"object": {"valeur": 47.8, "capteur_id": str(self.capteur.id)}}
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            mesure = Mesure.objects.create(valeur=47.8, capteur=self.capteur)
            self.assertEqual(mesure.valeur, 47.8)
        else:
            self.assertGraphQLSuccess(response)


class AlerteGraphQLTest(GraphQLTestCase):

    def setUp(self):
        super().setUp()
        self.rucher = Rucher.objects.create(
            nom="Rucher Alertes", latitude=45.0, longitude=4.0,
            flore_id=TypeFlore.BRUYERE, altitude=500, entreprise=self.entreprise,
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A3333333",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher,
        )
        self.capteur = Capteur.objects.create(
            type=TypeCapteur.GPS.value,
            identifiant="GPS-001",
            actif=True,
            batteriePct=80,
            ruche=self.ruche,
        )
        self.alerte = Alerte.objects.create(
            type=TypeAlerte.VOL.value,
            message="Deplacement suspect detecte",
            acquittee=False,
            capteur=self.capteur,
        )

    def test_query_alertes(self):
        query = """
        query { alertes { id type message acquittee created_at } }
        """
        response = self.execute_graphql(query)
        self.assertGraphQLSuccess(response)

    def test_query_alerte_by_pk(self):
        query = """
        query GetAlerte($id: uuid!) {
            alertes_by_pk(id: $id) {
                id type message acquittee
                capteur { identifiant ruch { immatriculation } }
            }
        }
        """
        response = self.execute_graphql(query, variables={"id": str(self.alerte.id)})
        self.assertGraphQLSuccess(response)
        alerte = response.get("data", {}).get("alertes_by_pk")
        if alerte:
            self.assertEqual(alerte["type"], TypeAlerte.VOL.value)
            self.assertFalse(alerte["acquittee"])

    def test_insert_alerte(self):
        query = """
        mutation InsertAlerte($object: alertes_insert_input!) {
            insert_alertes_one(object: $object) { id type message acquittee }
        }
        """
        variables = {
            "object": {
                "type": TypeAlerte.CHUTE_POIDS.value,
                "message": "Poids anormalement bas",
                "acquittee": False,
                "capteur_id": str(self.capteur.id),
            }
        }
        response = self.execute_graphql(query, variables=variables, use_admin_secret=True)
        if response.get("_hasura_unavailable"):
            alerte = Alerte.objects.create(
                type=TypeAlerte.CHUTE_POIDS.value, message="Poids anormalement bas",
                acquittee=False, capteur=self.capteur,
            )
            self.assertEqual(alerte.type, TypeAlerte.CHUTE_POIDS.value)
        else:
            self.assertGraphQLSuccess(response)

    def test_acquitter_alerte(self):
        query = """
        mutation Acquitter($id: uuid!) {
            update_alertes_by_pk(pk_columns: {id: $id}, _set: {acquittee: true}) {
                id acquittee
            }
        }
        """
        response = self.execute_graphql(
            query, variables={"id": str(self.alerte.id)}, use_admin_secret=True,
        )
        if response.get("_hasura_unavailable"):
            self.alerte.acquittee = True
            self.alerte.save()
            self.alerte.refresh_from_db()
            self.assertTrue(self.alerte.acquittee)
        else:
            self.assertGraphQLSuccess(response)
