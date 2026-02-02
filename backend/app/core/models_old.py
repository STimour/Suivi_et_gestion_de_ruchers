from django.db import models

class Ruche(models.Model):
    nom = models.CharField(max_length=100)
    localisation = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom
