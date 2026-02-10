'use client';

import { useMutation } from '@apollo/client/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Grip } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTacheTypeLabel,
  getStatutTacheStyle,
  getStatutTacheLabel,
} from '@/lib/constants/elevage.constants';
import { useUpdateTache } from '@/hooks/useElevage';
import { UPDATE_REINES_BY_RACLE } from '@/lib/graphql/mutations/reine.mutations';
import { GET_RACLES_ELEVAGE } from '@/lib/graphql/queries/reine.queries';

const TACHE_STATUT_REINE_MAP: Record<string, { statut: string; label: string }> = {
  ValidationPonte: { statut: 'Fecondee', label: 'Fécondées' },
  MiseEnVente: { statut: 'DisponibleVente', label: 'Disponibles à la vente' },
};

interface TacheCardProps {
  tache: any;
}

export function TacheCard({ tache }: TacheCardProps) {
  const { updateTache, loading } = useUpdateTache();
  const racle = tache.cycles_elevage_reine?.racle;

  const [updateReinesByRacle] = useMutation(UPDATE_REINES_BY_RACLE, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }],
  });

  const handleMarquerFaite = async () => {
    try {
      await updateTache({
        variables: {
          id: tache.id,
          changes: {
            statut: 'Faite',
            dateRealisee: new Date().toISOString().split('T')[0],
          },
        },
      });

      const mapping = TACHE_STATUT_REINE_MAP[tache.type];
      if (mapping && racle?.id) {
        await updateReinesByRacle({
          variables: {
            racleId: racle.id,
            changes: { statut: mapping.statut },
          },
        });
        toast.success('Tâche marquée comme faite', {
          description: `Reines du racle passées en « ${mapping.label} »`,
        });
      } else {
        toast.success('Tâche marquée comme faite');
      }
    } catch (error: any) {
      toast.error('Erreur', { description: error.message });
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {getTacheTypeLabel(tache.type)}
          </span>
          <Badge variant="outline" className={getStatutTacheStyle(tache.statut)}>
            {getStatutTacheLabel(tache.statut)}
          </Badge>
        </div>

        {tache.datePrevue && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            Prévue : {new Date(tache.datePrevue).toLocaleDateString('fr-FR')}
          </div>
        )}

        {racle && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Grip className="h-3 w-3 text-amber-600" />
            Racle : {racle.reference}
          </div>
        )}

        {tache.statut === 'AFaire' || tache.statut === 'EnRetard' ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 text-green-700 border-green-200 hover:bg-green-50"
            onClick={handleMarquerFaite}
            disabled={loading}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            {loading ? 'En cours...' : 'Marquer faite'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
