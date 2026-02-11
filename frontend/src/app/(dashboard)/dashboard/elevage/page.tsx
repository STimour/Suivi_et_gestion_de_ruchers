'use client';

import { Grip, Crown, Activity, AlertTriangle, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElevageStats } from '@/hooks/useElevage';
import { RacleCard } from '@/components/elevage/RacleCard';
import { TacheKanban } from '@/components/elevage/TacheKanban';
import { CreateRacleDialog } from '@/components/elevage/CreateRacleDialog';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ElevageDashboardPage() {
  const { user } = useAuth();
  const {
    totalRacles,
    totalReines,
    cyclesEnCours,
    tachesEnRetardCount,
    tachesAFaire,
    tachesFaites,
    tachesEnRetard,
    racles,
    loading,
  } = useElevageStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  const entrepriseId = user?.entreprise_id || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Elevage de Reines</h1>
          <p className="text-sm text-gray-500">Suivi des racles, cycles d'élevage et tâches</p>
        </div>
        <CreateRacleDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total racles</CardTitle>
            <Grip className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{totalRacles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reines en élevage</CardTitle>
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
      </div>

      {/* Tabs: Racles / Tâches */}
      <Tabs defaultValue="racles" className="space-y-4">
        <TabsList className="bg-amber-100/60 p-1 h-auto gap-1">
          <TabsTrigger
            value="racles"
            className="px-5 py-2.5 text-sm font-semibold gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md text-amber-800 rounded-md transition-all"
          >
            <Grip className="h-4 w-4" />
            Racles
          </TabsTrigger>
          <TabsTrigger
            value="taches"
            className="px-5 py-2.5 text-sm font-semibold gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md text-amber-800 rounded-md transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            Tâches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="racles">
          {racles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Grip className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun racle</p>
              <p className="text-xs mt-1">Créez un racle pour démarrer l'élevage</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {racles.map((racle: any) => (
                <RacleCard key={racle.id} racle={racle} entrepriseId={entrepriseId} />
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
