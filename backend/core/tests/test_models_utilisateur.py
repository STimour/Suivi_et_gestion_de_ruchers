from django.test import TestCase
from django.db import IntegrityError
from core.models import Utilisateur


class UtilisateurModelTest(TestCase):
    
    def setUp(self):
        self.user = Utilisateur.objects.create(
            nom="Ait",
            prenom="Melissa",
            email="ait.melissa@gmail.com",
            motDePasseHash="Melissa_123"
        )
    
    def test_str_representation(self):
        result = str(self.user)
        self.assertEqual(result, "Melissa Ait")
    
    def test_utilisateur_actif_par_defaut(self):
        self.assertTrue(self.user.actif)
    
    def test_utilisateur_date_creation_auto(self):
        self.assertIsNotNone(self.user.created_at)
    
    def test_email_unique_constraint(self):
        with self.assertRaises(IntegrityError):
            Utilisateur.objects.create(
                nom="Autre",
                prenom="User",
                email="ait.melissa@gmail.com",
                motDePasseHash="hash456"
            )
