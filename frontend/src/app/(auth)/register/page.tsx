'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('password-confirm') as string;

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      await register({
        email: formData.get('email') as string,
        password: password,
        nom: formData.get('nom') as string,
        prenom: formData.get('prenom') as string,
        entreprise_nom: formData.get('entreprise_nom') as string,
        entreprise_adresse: formData.get('entreprise_adresse') as string,
      });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo_ruche_1.png"
              alt="Logo Ruche"
              width={80}
              height={80}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-amber-900">Créer un compte</CardTitle>
            <CardDescription className="text-amber-700/70">
              Commencez à gérer vos ruchers dès aujourd'hui
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-900 border-b border-amber-200 pb-2">
                Informations personnelles
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-amber-900">Prénom *</Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    type="text"
                    placeholder="Jean"
                    required
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-amber-900">Nom *</Label>
                  <Input
                    id="nom"
                    name="nom"
                    type="text"
                    placeholder="Dupont"
                    required
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-900">Mot de passe *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-confirm" className="text-amber-900">
                    Confirmer *
                  </Label>
                  <Input
                    id="password-confirm"
                    name="password-confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-amber-900 border-b border-amber-200 pb-2">
                Informations de l'entreprise
              </h3>

              <div className="space-y-2">
                <Label htmlFor="entreprise_nom" className="text-amber-900">Nom de l'entreprise *</Label>
                <Input
                  id="entreprise_nom"
                  name="entreprise_nom"
                  type="text"
                  placeholder="Mon Rucher SARL"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entreprise_adresse" className="text-amber-900">Adresse de l'entreprise *</Label>
                <Input
                  id="entreprise_adresse"
                  name="entreprise_adresse"
                  type="text"
                  placeholder="123 rue des Abeilles, 75001 Paris"
                  required
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="terms" className="text-sm text-amber-700/70">
                J'accepte les{" "}
                <Link href="#" className="text-green-600 hover:underline">
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link href="#" className="text-green-600 hover:underline">
                  politique de confidentialité
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700/70">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
