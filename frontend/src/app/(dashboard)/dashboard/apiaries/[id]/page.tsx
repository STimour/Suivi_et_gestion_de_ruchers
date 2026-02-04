'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Flower2, Mountain, Hexagon, AlertCircle } from 'lucide-react';
import { LocationDisplay } from '@/components/rucher/LocationDisplay';
import { RucherMiniMapWrapper } from '@/components/rucher/RucherMiniMapWrapper';
import { TranshumanceDialog } from '@/components/rucher/TranshumanceDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { GET_RUCHER_DETAILS } from '@/lib/graphql/queries/rucher.queries';

interface RucherDetailsData {
  ruchers_by_pk: {
    id: string;
    nom: string;
    latitude: number;
    longitude: number;
    flore: string;
    altitude: number;
    notes: string;
    ruches: Array<{
      id: string;
      immatriculation: string;
      type: string;
      race: string;
      statut: string;
      maladie: string;
      securisee: boolean;
    }>;
  };
}

export default function RucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rucherId = params.id as string;

  const { data, loading, error } = useQuery<RucherDetailsData>(GET_RUCHER_DETAILS, {
    variables: { id: rucherId },
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data?.ruchers_by_pk) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-900">Erreur lors du chargement du rucher</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rucher = data.ruchers_by_pk;
  const ruchesActives = rucher.ruches.filter(r => r.statut === 'Active').length;
  const ruchesMalades = rucher.ruches.filter(r => r.statut === 'Malade').length;
  const ruchesMortes = rucher.ruches.filter(r => r.statut === 'Morte').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-amber-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">{rucher.nom}</h1>
            <LocationDisplay latitude={rucher.latitude} longitude={rucher.longitude} />
          </div>
        </div>
        <TranshumanceDialog
          rucherId={rucher.id}
          rucherNom={rucher.nom}
          currentLat={rucher.latitude}
          currentLng={rucher.longitude}
          currentFlore={rucher.flore}
        />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte */}
        <Card className="lg:col-span-2 border-amber-200 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <MapPin className="h-5 w-5" />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="h-[450px] rounded-lg overflow-hidden">
              <RucherMiniMapWrapper
                latitude={rucher.latitude}
                longitude={rucher.longitude}
                nom={rucher.nom}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total ruches</span>
                <Badge className="bg-amber-100 text-amber-900">
                  {rucher.ruches.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Actives</span>
                <Badge className="bg-green-100 text-green-800">
                  {ruchesActives}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Malades</span>
                <Badge className="bg-red-100 text-red-800">
                  {ruchesMalades}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mortes</span>
                <Badge className="bg-gray-100 text-gray-800">
                  {ruchesMortes}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informations du rucher */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Flower2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Flore:</span>
                <span className="text-sm text-gray-600">{rucher.flore}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Altitude:</span>
                <span className="text-sm text-gray-600">{rucher.altitude}m</span>
              </div>
              {rucher.notes && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{rucher.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Liste des ruches */}
      <Card className="border-amber-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Hexagon className="h-5 w-5" />
            Ruches ({rucher.ruches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rucher.ruches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Hexagon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune ruche dans ce rucher</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rucher.ruches.map((ruche) => (
                <Card
                  key={ruche.id}
                  className="border-amber-200 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-bold text-amber-900">
                        {ruche.immatriculation}
                      </CardTitle>
                      <Badge
                        variant={ruche.statut === 'Active' ? 'default' : 'destructive'}
                        className={
                          ruche.statut === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {ruche.statut}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Type:</span>{' '}
                      <span className="text-gray-600">{ruche.type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Race:</span>{' '}
                      <span className="text-gray-600">{ruche.race}</span>
                    </div>
                    <div>
                      <span className="font-medium">Maladie:</span>{' '}
                      <span className="text-gray-600">{ruche.maladie}</span>
                    </div>
                    {ruche.securisee && (
                      <Badge variant="outline" className="text-xs">
                        Sécurisée
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
