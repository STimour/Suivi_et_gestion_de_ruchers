'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Calendar } from 'lucide-react';
import {
  getStatutCycleStyle,
  getStatutCycleLabel,
  getTacheTypeLabel,
} from '@/lib/constants/elevage.constants';

interface ElevageCycleCardProps {
  cycle: any;
  reine: any;
}

export function ElevageCycleCard({ cycle, reine }: ElevageCycleCardProps) {
  const taches = cycle.taches_cycle_elevages ?? [];
  const tachesFaites = taches.filter((t: any) => t.statut === 'Faite').length;
  const totalTaches = taches.length;
  const progressValue = totalTaches > 0 ? (tachesFaites / totalTaches) * 100 : 0;

  const prochaineTache = taches.find((t: any) => t.statut === 'AFaire' || t.statut === 'EnRetard');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <span className="text-amber-900">
              {reine.codeCouleur} - {reine.anneeNaissance}
            </span>
          </CardTitle>
          <Badge variant="outline" className={getStatutCycleStyle(cycle.statut)}>
            {getStatutCycleLabel(cycle.statut)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          Début : {cycle.dateDebut ? new Date(cycle.dateDebut).toLocaleDateString('fr-FR') : '-'}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progression</span>
            <span>{tachesFaites}/{totalTaches} tâches</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {prochaineTache && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
            Prochaine : {getTacheTypeLabel(prochaineTache.type)}
            {prochaineTache.datePrevue && (
              <span className="text-gray-500">
                {' '}— {new Date(prochaineTache.datePrevue).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
