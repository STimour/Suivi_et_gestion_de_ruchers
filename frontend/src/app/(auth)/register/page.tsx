import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
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
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-amber-900">Prénom</Label>
                <Input
                  id="prenom"
                  type="text"
                  placeholder="Jean"
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-amber-900">Nom</Label>
                <Input
                  id="nom"
                  type="text"
                  placeholder="Dupont"
                  className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-900">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-900">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
              />
              <p className="text-xs text-amber-700/60">
                Au moins 8 caractères avec majuscule, minuscule et chiffre
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm" className="text-amber-900">
                Confirmer le mot de passe
              </Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="••••••••"
                className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
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
            >
              Créer mon compte
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-amber-700/70">Ou s'inscrire avec</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-amber-200 hover:bg-amber-50">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="border-amber-200 hover:bg-amber-50">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
