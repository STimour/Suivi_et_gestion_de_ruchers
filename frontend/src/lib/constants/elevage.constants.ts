export const TYPE_TACHE_ELEVAGE_OPTIONS = [
  { value: 'Greffage', label: 'Greffage (J0)', jour: 0 },
  { value: 'Operculation', label: 'Operculation (J6)', jour: 6 },
  { value: 'NaissanceReine', label: 'Naissance reine (J12)', jour: 12 },
  { value: 'ControleVolFecondation', label: 'Contrôle vol fécondation (J16)', jour: 16 },
  { value: 'ValidationPonte', label: 'Validation ponte (J21)', jour: 21 },
  { value: 'MarquageReine', label: 'Marquage reine (J25)', jour: 25 },
  { value: 'MiseEnVente', label: 'Mise en vente (J28)', jour: 28 },
] as const;

export const STATUT_CYCLE_OPTIONS = [
  { value: 'EnCours', label: 'En cours', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Termine', label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Annule', label: 'Annulé', color: 'bg-gray-100 text-gray-600 border-gray-200' },
] as const;

export const STATUT_TACHE_OPTIONS = [
  { value: 'AFaire', label: 'A faire', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'Faite', label: 'Faite', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'EnRetard', label: 'En retard', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Annulee', label: 'Annulée', color: 'bg-gray-100 text-gray-600 border-gray-200' },
] as const;

export function getTacheTypeLabel(value: string): string {
  return TYPE_TACHE_ELEVAGE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

export function getStatutTacheStyle(value: string): string {
  return STATUT_TACHE_OPTIONS.find((s) => s.value === value)?.color ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export function getStatutCycleStyle(value: string): string {
  return STATUT_CYCLE_OPTIONS.find((s) => s.value === value)?.color ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export function getStatutCycleLabel(value: string): string {
  return STATUT_CYCLE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function getStatutTacheLabel(value: string): string {
  return STATUT_TACHE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}
