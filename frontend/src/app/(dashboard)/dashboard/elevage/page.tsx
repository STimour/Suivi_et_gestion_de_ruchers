'use client';

import { Crown, Activity, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElevageStats } from '@/hooks/useElevage';
import { ElevageCycleCard } from '@/components/elevage/ElevageCycleCard';
import { TacheKanban } from '@/components/elevage/TacheKanban';
import { CreateReineDialog } from '@/components/reine/CreateReineDialog';
import { getTacheTypeLabel } from '@/lib/constants/elevage.constants';

export default function ElevageDashboardPage() {
  const {
    totalReines,
    cyclesEnCours,
    tachesEnRetardCount,
    prochaineTache,
    tachesAFaire,
    tachesFaites,
    tachesEnRetard,
    reines,
    loading,
  } = useElevageStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  // Collect all active cycles with their reine
  const activeCycles: { cycle: any; reine: any }[] = [];
  for (const reine of reines) {
    for (const cycle of reine.cycles_elevage_reines ?? []) {
      if (cycle.statut === 'EnCours') {
        activeCycles.push({ cycle, reine });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Elevage de Reines</h1>
          <p className="text-sm text-gray-500">Suivi des cycles d'élevage et des tâches</p>
        </div>
        <CreateReineDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total reines élevage</CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{totalReines}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Cycles en cours</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{cyclesEnCours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tâches en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{tachesEnRetardCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Prochaine tâche</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {prochaineTache ? (
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {getTacheTypeLabel(prochaineTache.type)}
                </div>
                {prochaineTache.datePrevue && (
                  <div className="text-xs text-gray-500">
                    {new Date(prochaineTache.datePrevue).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Aucune</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Cycles / Tâches */}
      <Tabs defaultValue="cycles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cycles">Cycles en cours</TabsTrigger>
          <TabsTrigger value="taches">Tâches</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          {activeCycles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Crown className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun cycle d'élevage en cours</p>
              <p className="text-xs mt-1">Créez une reine pour démarrer un cycle</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCycles.map(({ cycle, reine }) => (
                <ElevageCycleCard key={cycle.id} cycle={cycle} reine={reine} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="taches">
          <TacheKanban
            tachesAFaire={tachesAFaire}
            tachesFaites={tachesFaites}
            tachesEnRetard={tachesEnRetard}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
