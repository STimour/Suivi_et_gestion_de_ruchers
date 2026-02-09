from django.test import TestCase
from django.db import IntegrityError
from core.models import Utilisateur, Entreprise, UtilisateurEntreprise, RoleUtilisateur


class UtilisateurEntrepriseModelTest(TestCase):
    
    def setUp(self):
        self.user = Utilisateur.objects.create(
            nom="Ait",
            prenom="Melissa",
            email="ait.melissa@gmail.com",
            motDePasseHash="Melissa_123"
        )
        
        self.entreprise = Entreprise.objects.create(
            nom="Ruches & Co",
            adresse="Lyon, France"
        )
        
        self.relation = UtilisateurEntreprise.objects.create(
            utilisateur=self.user,
            entreprise=self.entreprise,
            role=RoleUtilisateur.APICULTEUR
        )
    
    def test_str_representation(self):
        result = str(self.relation)
        self.assertIn("Melissa Ait", result)
        self.assertIn("Ruches & Co", result)
        self.assertIn("Apiculteur", result)
    
    def test_unique_together_constraint(self):
        with self.assertRaises(IntegrityError):
            UtilisateurEntreprise.objects.create(
                utilisateur=self.user,
                entreprise=self.entreprise,
                role=RoleUtilisateur.ADMIN_ENTREPRISE
            )
    
    def test_utilisateur_peut_avoir_plusieurs_entreprises(self):
        entreprise2 = Entreprise.objects.create(
            nom="Abeilles Pro",
            adresse="Paris, France"
        )
        
        UtilisateurEntreprise.objects.create(
            utilisateur=self.user,
            entreprise=entreprise2,
            role=RoleUtilisateur.LECTEUR
        )
        
        self.assertEqual(self.user.appartenances.count(), 2)
    
    def test_suppression_utilisateur_supprime_relations(self):
        self.assertEqual(UtilisateurEntreprise.objects.count(), 1)
        self.user.delete()
        self.assertEqual(UtilisateurEntreprise.objects.count(), 0)
