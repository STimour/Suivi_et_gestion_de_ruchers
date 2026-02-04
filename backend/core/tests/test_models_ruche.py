from django.test import TestCase
from django.db import IntegrityError
from core.models import Ruche, Rucher, Entreprise, StatutRuche, TypeMaladie, TypeFlore, TypeRuche, TypeRaceAbeille


class RucheModelTest(TestCase):
    
    def setUp(self):
        self.flore, _ = TypeFlore.objects.get_or_create(
            value=TypeFlore.LAVANDE,
            defaults={"label": "Lavande"},
        )
        self.type_ruche, _ = TypeRuche.objects.get_or_create(
            value=TypeRuche.DADANT,
            defaults={"label": "Dadant"},
        )
        self.race, _ = TypeRaceAbeille.objects.get_or_create(
            value=TypeRaceAbeille.BUCKFAST,
            defaults={"label": "Buckfast"},
        )
        self.maladie, _ = TypeMaladie.objects.get_or_create(
            value=TypeMaladie.AUCUNE,
            defaults={"label": "Aucune"},
        )

        self.entreprise = Entreprise.objects.create(
            nom="Ruches & Co",
            adresse="Lyon"
        )
        self.rucher = Rucher.objects.create(
            nom="Rucher Principal",
            latitude=45.0,
            longitude=4.0,
            flore=self.flore,
            altitude=500,
            entreprise=self.entreprise
        )
        self.ruche = Ruche.objects.create(
            immatriculation="A1234567",
            type=self.type_ruche,
            race=self.race,
            rucher=self.rucher
        )
    
    def test_str_representation(self):
        result = str(self.ruche)
        self.assertEqual(result, "A1234567")
    
    def test_ruche_statut_active_par_defaut(self):
        self.assertEqual(self.ruche.statut, StatutRuche.ACTIVE)
    
    def test_ruche_maladie_aucune_par_defaut(self):
        self.assertEqual(self.ruche.maladie_id, TypeMaladie.AUCUNE)
    
    def test_ruche_securisee_false_par_defaut(self):
        self.assertFalse(self.ruche.securisee)
    
    def test_immatriculation_unique(self):
        with self.assertRaises(IntegrityError):
            Ruche.objects.create(
                immatriculation="A1234567",
                type=self.type_ruche,
                race=self.race,
                rucher=self.rucher
            )
