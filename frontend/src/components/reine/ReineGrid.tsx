import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, MapPin, Hexagon, Pencil, Trash2, Calendar, Eye, Grip } from "lucide-react";
import Link from 'next/link';
import { EditReineDialog } from './EditReineDialog';
import { useCanEdit } from '@/hooks/useCanEdit';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReineGridProps {
    reines: any[];
    onDelete: (id: string) => void;
    isEleveur?: boolean;
}

const STATUT_MAP: Record<string, { label: string; color: string; dot: string }> = {
    Fecondee: { label: 'Fécondée', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    NonFecondee: { label: 'Non fécondée', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    DisponibleVente: { label: 'Dispo. vente', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    Vendu: { label: 'Vendue', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    Perdue: { label: 'Perdue', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    Eliminee: { label: 'Éliminée', color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const getStatut = (statut: string) =>
    STATUT_MAP[statut] ?? { label: statut || '—', color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };

const getColorBadge = (color: string) => {
    const colors: Record<string, string> = {
        'Blanc': 'bg-white text-gray-800 border border-gray-300',
        'Jaune': 'bg-yellow-400 text-yellow-900',
        'Rouge': 'bg-red-500 text-white',
        'Vert': 'bg-green-500 text-white',
        'Bleu': 'bg-blue-500 text-white',
    };
    return colors[color] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function ReineGrid({ reines, onDelete, isEleveur }: ReineGridProps) {
    const [editingReineId, setEditingReineId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const canEdit = useCanEdit();

    if (reines.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed border-amber-200">
                <Crown className="h-12 w-12 mx-auto mb-3 text-amber-200" />
                <p>Aucune reine trouvée</p>
            </div>
        );
    }

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reines.map((reine) => (
                    <Card
                        key={reine.id}
                        className="group hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm border-amber-200 hover:border-amber-400"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-mono font-bold text-amber-900 flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-amber-600" />
                                        {reine.anneeNaissance}
                                    </CardTitle>
                                    {reine.codeCouleur && (
                                        <Badge className={getColorBadge(reine.codeCouleur)}>
                                            {reine.codeCouleur}
                                        </Badge>
                                    )}
                                </div>
                                <Badge variant="outline" className={`${getStatut(reine.statut).color} gap-1.5`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${getStatut(reine.statut).dot}`} />
                                    {getStatut(reine.statut).label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-3">
                                <div className="text-sm">
                                    <span className="text-xs text-gray-400 block">Lignée</span>
                                    <span className="text-gray-700">{reine.lignee || '—'}</span>
                                </div>

                                {isEleveur ? (
                                    <div className="text-sm">
                                        <span className="text-xs text-gray-400 block">Racle</span>
                                        {reine.racle ? (
                                            <span className="flex items-center gap-1 text-amber-700">
                                                <Grip className="h-3 w-3" />
                                                {reine.racle.reference}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-xs text-gray-400 block">Ruche</span>
                                            {reine.ruche ? (
                                                <Link href={`/dashboard/hives/${reine.ruche.id}`} className="flex items-center gap-1 text-green-600 hover:text-green-700">
                                                    <Hexagon className="h-3 w-3" />
                                                    {reine.ruche.immatriculation}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block">Rucher</span>
                                            {reine.ruche?.rucher ? (
                                                <Link href={`/dashboard/apiaries/${reine.ruche.rucher.id}`} className="flex items-center gap-1 text-amber-600 hover:text-amber-700">
                                                    <MapPin className="h-3 w-3" />
                                                    {reine.ruche.rucher.nom}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {reine.created_at && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Ajoutée le {formatDate(reine.created_at)}</span>
                                    </div>
                                )}

                                {/* Placeholder sections for future features */}
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 rounded bg-gray-50 border border-dashed border-gray-200 opacity-50">
                                            <span className="text-xs text-gray-400">Cycle</span>
                                        </div>
                                        <div className="flex-1 p-2 rounded bg-gray-50 border border-dashed border-gray-200 opacity-50">
                                            <span className="text-xs text-gray-400">Généalogie</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <Link href={`/dashboard/reines/${reine.id}`}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Détails
                                </Button>
                            </Link>
                            {canEdit && (
                                <div className="flex items-center gap-1 ml-auto">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                        onClick={() => setEditingReineId(reine.id)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteConfirmId(reine.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {canEdit && editingReineId && (
                <EditReineDialog
                    reineId={editingReineId}
                    open={!!editingReineId}
                    onOpenChange={(open) => !open && setEditingReineId(null)}
                    isEleveur={isEleveur}
                />
            )}

            {canEdit && (
                <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette reine ? Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
