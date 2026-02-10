'use client';

import { Badge } from '@/components/ui/badge';
import { TacheCard } from './TacheCard';

interface TacheKanbanProps {
  tachesAFaire: any[];
  tachesFaites: any[];
  tachesEnRetard: any[];
}

function KanbanColumn({
  title,
  taches,
  badgeClass,
}: {
  title: string;
  taches: any[];
  badgeClass: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <Badge variant="outline" className={badgeClass}>
          {taches.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {taches.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Aucune tâche</p>
        ) : (
          taches.map((tache: any) => (
            <TacheCard key={tache.id} tache={tache} />
          ))
        )}
      </div>
    </div>
  );
}

export function TacheKanban({ tachesAFaire, tachesFaites, tachesEnRetard }: TacheKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KanbanColumn
        title="A faire"
        taches={tachesAFaire}
        badgeClass="bg-amber-100 text-amber-800 border-amber-200"
      />
      <KanbanColumn
        title="Faites"
        taches={tachesFaites}
        badgeClass="bg-green-100 text-green-800 border-green-200"
      />
      <KanbanColumn
        title="En retard"
        taches={tachesEnRetard}
        badgeClass="bg-red-100 text-red-800 border-red-200"
      />
    </div>
  );
}
