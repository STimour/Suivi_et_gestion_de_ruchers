import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, MapPin, LineChart, Bell, Smartphone } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo_ruche_1.png"
            alt="Logo Ruche"
            width={120}
            height={120}
            priority
            className="object-contain"
          />
        </div>
        <h1 className="text-5xl font-bold text-amber-900 mb-4">
          Gestion de Ruchers
        </h1>
        <p className="text-xl text-amber-700/80 max-w-2xl mx-auto mb-8">
          Plateforme moderne pour la gestion professionnelle de vos ruchers, ruches et interventions apicoles
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
            Commencer
          </Button>
          <Button size="lg" variant="outline" className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white">
            En savoir plus
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-amber-900">Fonctionnalités</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-amber-100 w-fit p-3 rounded-lg mb-2">
                <MapPin className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900">Cartographie</CardTitle>
              <CardDescription className="text-amber-700/70">
                Localisez vos ruchers sur une carte interactive et gérez les transhumances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Géolocalisation GPS</li>
                <li>Suivi des déplacements</li>
                <li>Optimisation des emplacements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-green-100 w-fit p-3 rounded-lg mb-2">
                <Hexagon className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-amber-900">Gestion des Ruches</CardTitle>
              <CardDescription className="text-amber-700/70">
                Suivez l'état de chaque ruche et de ses reines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Fiche détaillée par ruche</li>
                <li>Généalogie des reines</li>
                <li>Historique complet</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-amber-100 w-fit p-3 rounded-lg mb-2">
                <LineChart className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900">Interventions Groupées</CardTitle>
              <CardDescription className="text-amber-700/70">
                Enregistrez rapidement des interventions sur plusieurs ruches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Sélection multiple</li>
                <li>Wizard intuitif</li>
                <li>Gain de temps massif</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-orange-100 w-fit p-3 rounded-lg mb-2">
                <Bell className="h-10 w-10 text-orange-500" />
              </div>
              <CardTitle className="text-amber-900">Alertes IoT</CardTitle>
              <CardDescription className="text-amber-700/70">
                Recevez des alertes en temps réel depuis vos capteurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Surveillance poids</li>
                <li>Température & humidité</li>
                <li>Détection de vol</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-green-100 w-fit p-3 rounded-lg mb-2">
                <Smartphone className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-amber-900">Mode Offline</CardTitle>
              <CardDescription className="text-amber-700/70">
                Travaillez en plein champ sans connexion internet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Application PWA</li>
                <li>Sync automatique</li>
                <li>Interface tactile optimisée</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/80 border-amber-200">
            <CardHeader>
              <div className="bg-amber-100 w-fit p-3 rounded-lg mb-2">
                <LineChart className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900">Analytics & Scores</CardTitle>
              <CardDescription className="text-amber-700/70">
                Identifiez vos meilleures ruches et optimisez la production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-amber-700/70 space-y-1">
                <li>Dashboard Elite</li>
                <li>Graphiques de production</li>
                <li>Recommandations IA</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-amber-700/70 border-t border-amber-200">
        <p>&copy; 2026 Gestion de Ruchers - Application Honey & Nature</p>
      </footer>
    </div>
  );
}