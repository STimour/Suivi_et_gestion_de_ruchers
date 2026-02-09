from django.test import TestCase
from django.core.exceptions import ValidationError
from core.models import Reine, LigneeReine


class ReineModelTest(TestCase):

    def setUp(self):
        LigneeReine.objects.get_or_create(value=LigneeReine.BUCKFAST, defaults={"label": "Buckfast"})
        self.reine = Reine.objects.create(
            anneeNaissance=2020,
            codeCouleur="Rouge",
            lignee_id=LigneeReine.BUCKFAST,
            noteDouceur=8
        )
    
    def test_str_representation(self):
        result = str(self.reine)
        self.assertEqual(result, "Reine Rouge (2020)")
    
    def test_annee_naissance_min_1900(self):
        reine = Reine(
            anneeNaissance=1800,
            codeCouleur="Blanc",
            lignee_id=LigneeReine.BUCKFAST,
            noteDouceur=5
        )
        with self.assertRaises(ValidationError):
            reine.full_clean()
    
    def test_annee_naissance_max_2100(self):
        reine = Reine(
            anneeNaissance=2200,
            codeCouleur="Blanc",
            lignee_id=LigneeReine.BUCKFAST,
            noteDouceur=5
        )
        with self.assertRaises(ValidationError):
            reine.full_clean()
    
    def test_note_douceur_entre_1_et_10(self):
        reine = Reine(
            anneeNaissance=2020,
            codeCouleur="Blanc",
            lignee_id=LigneeReine.BUCKFAST,
            noteDouceur=20
        )
        with self.assertRaises(ValidationError):
            reine.full_clean()
    
    def test_non_reproductible_false_par_defaut(self):
        self.assertFalse(self.reine.nonReproductible)
