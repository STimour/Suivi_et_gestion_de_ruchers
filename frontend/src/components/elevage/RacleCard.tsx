'use client';

import { useMutation } from '@apollo/client/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Grip, Crown, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { DELETE_RACLE_CASCADE, UPDATE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { GET_RACLES_ELEVAGE } from '@/lib/graphql/queries/reine.queries';
import { getTacheTypeLabel } from '@/lib/constants/elevage.constants';
import { AddReineToRacleDialog } from './AddReineToRacleDialog';

const STATUT_REINE_OPTIONS = [
  { value: 'Fecondee', label: 'Fécondée' },
  { value: 'NonFecondee', label: 'Non fécondée' },
  { value: 'DisponibleVente', label: 'Dispo. vente' },
  { value: 'Vendu', label: 'Vendue' },
  { value: 'Perdue', label: 'Perdue' },
  { value: 'Eliminee', label: 'Éliminée' },
];

interface RacleCardProps {
  racle: any;
  entrepriseId: string;
}

const MAX_VISIBLE_REINES = 5;

export function RacleCard({ racle, entrepriseId }: RacleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteRacle, { loading: deleting }] = useMutation(DELETE_RACLE_CASCADE, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }],
    onCompleted: () => {
      toast.success('Racle supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression', { description: error.message });
    },
  });

  const [updateReine] = useMutation(UPDATE_REINE, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }],
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour', { description: error.message });
    },
  });

  const handleStatutChange = async (reineId: string, newStatut: string) => {
    try {
      await updateReine({
        variables: { id: reineId, changes: { statut: newStatut } },
      });
      toast.success('Statut mis à jour');
    } catch (error) {
      // handled by onError
    }
  };

  const reines = racle.reines ?? [];
  const nbCupules: number = racle.nbCupules ?? 0;
  const isFull = reines.length >= nbCupules;
  const cycles = racle.cycles_elevage_reines ?? [];
  const cycleActif = cycles.find((c: any) => c.statut === 'EnCours');

  const taches = cycleActif?.taches_cycle_elevages ?? [];
  const tachesFaites = taches.filter((t: any) => t.statut === 'Faite').length;
  const totalTaches = taches.length;
  const progressValue = totalTaches > 0 ? (tachesFaites / totalTaches) * 100 : 0;
  const prochaineTache = taches.find((t: any) => t.statut === 'AFaire' || t.statut === 'EnRetard');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Grip className="h-4 w-4 text-amber-600" />
            <span className="text-amber-900">{racle.reference}</span>
          </CardTitle>
          <Badge variant="outline" className={isFull
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-800 border-amber-200"
          }>
            {reines.length}/{nbCupules} cupules
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reines */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reines</h4>
          {reines.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune reine</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {(expanded ? reines : reines.slice(0, MAX_VISIBLE_REINES)).map((reine: any) => (
                  <div key={reine.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 min-w-0">
                      <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="truncate">{reine.codeCouleur} - {reine.anneeNaissance}</span>
                    </div>
                    <Select
                      value={reine.statut || ''}
                      onValueChange={(val) => handleStatutChange(reine.id, val)}
                    >
                      <SelectTrigger className="h-6 text-[11px] w-[110px] px-2 py-0 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {STATUT_REINE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {reines.length > MAX_VISIBLE_REINES && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium pt-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      Réduire
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Voir les {reines.length - MAX_VISIBLE_REINES} autres reines
                    </>
                  )}
                </button>
              )}
            </>
          )}
          {isFull ? (
            <p className="text-xs text-red-500">Toutes les cupules sont occupées</p>
          ) : (
            <AddReineToRacleDialog
              racleId={racle.id}
              racleReference={racle.reference}
              entrepriseId={entrepriseId}
              currentCount={reines.length}
              maxCupules={nbCupules}
            />
          )}
        </div>

        {/* Cycle actif */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</h4>
          {cycleActif ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progression</span>
                <span>{tachesFaites}/{totalTaches} tâches</span>
              </div>
              <Progress value={progressValue} className="h-2" />
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
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Ajoutez une reine pour démarrer un cycle
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {racle.dateCreation
              ? new Date(racle.dateCreation).toLocaleDateString('fr-FR')
              : '-'}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le racle ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le racle &quot;{racle.reference}&quot; et toutes ses données associées seront supprimés.
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteRacle({ variables: { racleId: racle.id } })}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
