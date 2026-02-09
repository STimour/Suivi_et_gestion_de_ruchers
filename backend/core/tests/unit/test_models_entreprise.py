from django.test import TestCase
from core.models import Entreprise


class EntrepriseModelTest(TestCase):
    
    def setUp(self):
        self.entreprise = Entreprise.objects.create(
            nom="Ruches & Co",
            adresse="Lyon, France"
        )
    
    def test_str_representation(self):
        result = str(self.entreprise)
        self.assertEqual(result, "Ruches & Co")
    
    def test_entreprise_date_creation_auto(self):
        self.assertIsNotNone(self.entreprise.created_at)
