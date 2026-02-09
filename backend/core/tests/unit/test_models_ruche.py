from django.test import TestCase
from django.db import IntegrityError
from core.models import (
    Ruche, Rucher, Entreprise, StatutRuche,
    TypeFlore, TypeRuche, TypeRaceAbeille, TypeMaladie,
)


class RucheModelTest(TestCase):

    def setUp(self):
        TypeFlore.objects.get_or_create(value=TypeFlore.LAVANDE, defaults={"label": "Lavande"})
        TypeRuche.objects.get_or_create(value=TypeRuche.DADANT, defaults={"label": "Dadant"})
        TypeRaceAbeille.objects.get_or_create(value=TypeRaceAbeille.BUCKFAST, defaults={"label": "Buckfast"})
        TypeMaladie.objects.get_or_create(value=TypeMaladie.AUCUNE, defaults={"label": "Aucune"})
        self.entreprise = Entreprise.objects.create(
            nom="Ruches & Co",
            adresse="Lyon"
        )
        self.rucher = Rucher.objects.create(
            nom="Rucher Principal",
            latitude=45.0,
            longitude=4.0,
            flore_id=TypeFlore.LAVANDE,
            altitude=500,
            entreprise=self.entreprise
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A0000001",
            type_id=TypeRuche.DADANT,
            race_id=TypeRaceAbeille.BUCKFAST,
            rucher=self.rucher
        )
    
    def test_str_representation(self):
        result = str(self.ruche)
        self.assertEqual(result, "A0000001")

    def test_ruche_statut_active_par_defaut(self):
        self.assertEqual(self.ruche.statut, StatutRuche.ACTIVE)

    def test_ruche_maladie_aucune_par_defaut(self):
        self.assertEqual(self.ruche.maladie_id, TypeMaladie.AUCUNE)
    
    def test_ruche_securisee_false_par_defaut(self):
        self.assertFalse(self.ruche.securisee)
    
    def test_immatriculation_unique(self):
        with self.assertRaises(IntegrityError):
            Ruche.objects.create(
                immatriculation="A0000001",
                type_id=TypeRuche.DADANT,
                race_id=TypeRaceAbeille.BUCKFAST,
                rucher=self.rucher
            )
