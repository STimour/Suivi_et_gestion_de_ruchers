'use client';

import { useQuery } from '@apollo/client/react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hexagon, MapPin, Plus, TrendingUp, AlertTriangle, Upload, Crown } from "lucide-react";
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { GET_REINES } from '@/lib/graphql/queries/reine.queries';
import { CreateRucherDialog } from '@/components/rucher/RucherDialog';
import { CreateRucheDialog } from '@/components/ruche/CreateRucheDialog';
import { BulkCreateRuchesDialog } from '@/components/ruche/BulkCreateRuchesDialog';
import { CreateReineDialog } from '@/components/reine/CreateReineDialog';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useProfileMode } from '@/lib/context/ProfileModeContext';
import { useCanEdit } from '@/hooks/useCanEdit';
import { useQuota } from '@/hooks/useQuota';

// Charger la carte uniquement côté client pour éviter les erreurs SSR
const RuchersMap = dynamic(
  () => import('@/components/rucher/RuchersMap').then((mod) => mod.RuchersMap),
  {
    ssr: false,
    loading: () => (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <MapPin className="h-5 w-5" />
            Carte des ruchers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const { isEleveur } = useProfileMode();

  if (isEleveur) {
    router.replace('/dashboard/elevage');
    return null;
  }

  const { data: ruchersData, loading: ruchersLoading, error: ruchersError } = useQuery<any>(GET_RUCHERS);
  const { data: ruchesData, loading: ruchesLoading, error: ruchesError } = useQuery<any>(GET_RUCHES);
  const { data: reinesData, loading: reinesLoading, error: reinesError } = useQuery<any>(GET_REINES);

  const canEdit = useCanEdit();
  const { canCreateRucher, canCreateReine } = useQuota();

  const totalRuchers = ruchersData?.ruchers?.length || 0;
  const totalRuches = ruchesData?.ruches?.length || 0;
  const totalReines = reinesData?.reines?.length || 0;
  const ruchesActives = ruchesData?.ruches?.filter((r: any) => r.statut === 'Active')?.length || 0;
  const ruchesMalades = ruchesData?.ruches?.filter((r: any) => r.statut === 'Malade')?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
          <p className="text-amber-700/70 mt-1">
            Vue d'ensemble de vos ruchers et ruches
          </p>
        </div>
        {canEdit && (
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle intervention
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Total Ruchers
            </CardTitle>
            <MapPin className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {ruchersLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-amber-900">{totalRuchers}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Total Ruches
            </CardTitle>
            <Hexagon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {ruchesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-amber-900">{totalRuches}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Total Reines
            </CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {reinesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-amber-900">{totalReines}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Ruches Actives
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {ruchesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{ruchesActives}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Alertes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {ruchesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">{ruchesMalades}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erreur */}
      {(ruchersError || ruchesError || reinesError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur de connexion au serveur GraphQL. Vérifiez que Hasura est bien démarré sur le port 8081.
            <br />
            <code className="text-xs mt-2 block">
              {ruchersError?.message || ruchesError?.message}
            </code>
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des Ruchers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex flex-wrap gap-5 items-center justify-between">
              <div>
                <CardTitle className="text-amber-900">Mes Ruchers</CardTitle>
                <CardDescription className="text-amber-700/70">
                  Liste de vos emplacements
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {canEdit && canCreateRucher && (
                  <CreateRucherDialog
                    trigger={
                      <Button variant="outline" size="sm" className="border-amber-200">
                        <Plus className="h-4 w-4 mr-1" />
                        Nouveau
                      </Button>
                    }
                  />
                )}
                {canEdit && !canCreateRucher && (
                  <Button variant="outline" size="sm" className="border-amber-200" disabled>
                    <Plus className="h-4 w-4 mr-1" />
                    Nouveau (limite Freemium atteinte)
                  </Button>
                )}
                <Link href="/dashboard/apiaries">
                  <Button variant="outline" size="sm" className="border-amber-200">
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ruchersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ruchersData?.ruchers?.length > 0 ? (
              <div className="space-y-3">
                {ruchersData.ruchers.slice(0, 5).map((rucher: any) => (
                  <div
                    key={rucher.id}
                    className="flex flex-wrap gap-5 items-center justify-between p-3 rounded-lg border border-amber-100 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">{rucher.nom}</p>
                        <p className="text-sm text-amber-700/70">
                          {rucher.latitude?.toFixed(4)}, {rucher.longitude?.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/apiaries/${rucher.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-amber-700/70">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun rucher pour le moment</p>
                {canEdit && canCreateRucher && (
                  <CreateRucherDialog
                    trigger={
                      <Button variant="outline" size="sm" className="mt-3 border-amber-200">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un rucher
                      </Button>
                    }
                  />
                )}
                {canEdit && !canCreateRucher && (
                  <Button variant="outline" size="sm" className="mt-3 border-amber-200" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un rucher (limite Freemium atteinte)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des Ruches récentes */}
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex flex-wrap gap-5 items-center justify-between">
              <div>
                <CardTitle className="text-amber-900">Ruches récentes</CardTitle>
                <CardDescription className="text-amber-700/70">
                  Dernières ruches ajoutées
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <CreateRucheDialog
                    trigger={
                      <Button variant="outline" size="sm" className="border-green-200">
                        <Plus className="h-4 w-4 mr-1" />
                        Nouvelle
                      </Button>
                    }
                  />
                )}
                {canEdit && (
                  <BulkCreateRuchesDialog
                    trigger={
                      <Button variant="outline" size="sm" className="border-green-200 text-green-700">
                        <Upload className="h-4 w-4 mr-1" />
                        Import masse
                      </Button>
                    }
                  />
                )}
                <Link href="/dashboard/hives">
                  <Button variant="outline" size="sm" className="border-green-200">
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ruchesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ruchesData?.ruches?.length > 0 ? (
              <div className="space-y-3">
                {ruchesData.ruches.slice(0, 5).map((ruche: any) => (
                  <div
                    key={ruche.id}
                    className="flex flex-wrap gap-5 items-center justify-between p-3 rounded-lg border border-green-100 hover:bg-green-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Hexagon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">{ruche.immatriculation}</p>
                        <p className="text-sm text-amber-700/70">
                          {ruche.rucher?.nom || 'Sans rucher'} • {ruche.statut}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/hives/${ruche.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-amber-700/70">
                <Hexagon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">Aucune ruche pour le moment</p>
                {canEdit && (
                  <div className="flex gap-2 justify-center">
                    <CreateRucheDialog
                      trigger={
                        <Button variant="outline" size="sm" className="border-green-200">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une ruche
                        </Button>
                      }
                    />
                    <BulkCreateRuchesDialog
                      trigger={
                        <Button variant="outline" size="sm" className="border-green-200 text-green-700">
                          <Upload className="h-4 w-4 mr-2" />
                          Import en masse
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Reines récentes */}
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex flex-wrap gap-5 items-center justify-between">
            <div>
              <CardTitle className="text-amber-900">Reines récentes</CardTitle>
              <CardDescription className="text-amber-700/70">
                Dernières reines ajoutées
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {canEdit && canCreateReine && (
                <CreateReineDialog
                  trigger={
                    <Button variant="outline" size="sm" className="border-amber-200">
                      <Plus className="h-4 w-4 mr-1" />
                      Nouvelle
                    </Button>
                  }
                />
              )}
              {canEdit && !canCreateReine && (
                <Button variant="outline" size="sm" className="border-amber-200" disabled>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle (limite Freemium atteinte)
                </Button>
              )}
              <Link href="/dashboard/reines">
                <Button variant="outline" size="sm" className="border-amber-200">
                  Voir tout
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reinesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reinesData?.reines?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reinesData.reines.slice(0, 6).map((reine: any) => (
                <div
                  key={reine.id}
                  className="flex flex-wrap gap-5 items-center justify-between p-3 rounded-lg border border-amber-100 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Crown className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900">{reine.anneeNaissance} - {reine.codeCouleur || 'N/A'}</p>
                      <p className="text-sm text-amber-700/70">
                        {reine.lignee || 'Lignée non renseignée'} • {reine.ruche?.immatriculation || 'Sans ruche'}
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/reines">
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-amber-700/70">
              <Crown className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="mb-4">Aucune reine pour le moment</p>
              {canEdit && canCreateReine && (
                <CreateReineDialog
                  trigger={
                    <Button variant="outline" size="sm" className="border-amber-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une reine
                    </Button>
                  }
                />
              )}
              {canEdit && !canCreateReine && (
                <Button variant="outline" size="sm" className="border-amber-200" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une reine (limite Freemium atteinte)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte des ruchers */}
      <RuchersMap ruchers={ruchersData?.ruchers || []} loading={ruchersLoading} />
    </div>
  );
}
