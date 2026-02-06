from django.test import TestCase
from core.models import Rucher, Entreprise


class RucherModelTest(TestCase):
    
    def setUp(self):
        self.entreprise = Entreprise.objects.create(
            nom="Ruches & Co",
            adresse="Lyon"
        )
        self.rucher = Rucher.objects.create(
            nom="Rucher Principal",
            latitude=45.0,
            longitude=4.0,
            flore="Lavande",
            altitude=500,
            entreprise=self.entreprise
        )
    
    def test_str_representation(self):
        result = str(self.rucher)
        self.assertEqual(result, "Rucher Principal")
    
    def test_notes_vide_par_defaut(self):
        self.assertEqual(self.rucher.notes, "")
    
    def test_suppression_entreprise_supprime_ruchers(self):
        self.assertEqual(Rucher.objects.count(), 1)
        self.entreprise.delete()
        self.assertEqual(Rucher.objects.count(), 0)
