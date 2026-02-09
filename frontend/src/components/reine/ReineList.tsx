import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, MapPin, Hexagon, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

interface ReineListProps {
    reines: any[];
    onDelete: (id: string) => void;
}

const getStatutColor = (statut: string) => {
    switch (statut) {
        case 'ACTIVE':
            return 'bg-green-100 text-green-800';
        case 'LOST':
            return 'bg-yellow-100 text-yellow-800';
        case 'REPLACED':
            return 'bg-blue-100 text-blue-800';
        case 'DEAD':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatutLabel = (statut: string) => {
    switch (statut) {
        case 'ACTIVE':
            return 'Active';
        case 'LOST':
            return 'Perdue';
        case 'REPLACED':
            return 'Remplacée';
        case 'DEAD':
            return 'Morte';
        default:
            return statut || 'Active';
    }
};

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

export function ReineList({ reines, onDelete }: ReineListProps) {
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
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-amber-50/50">
                        <TableRow>
                            <TableHead className="w-30">Identifiant</TableHead>
                            <TableHead>Année / Couleur</TableHead>
                            <TableHead>Lignée</TableHead>
                            <TableHead>Ruche</TableHead>
                            <TableHead>Rucher</TableHead>
                            <TableHead className="text-center">Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reines.map((reine) => (
                            <TableRow key={reine.id} className="hover:bg-amber-50/30">
                                <TableCell className="font-mono font-medium text-amber-900">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-amber-600" />
                                        {reine.id.slice(0, 8)}...
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{reine.anneeNaissance}</span>
                                        {reine.codeCouleur && (
                                            <Badge className={getColorBadge(reine.codeCouleur)}>
                                                {reine.codeCouleur}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{reine.lignee || '—'}</TableCell>
                                <TableCell>
                                    {reine.ruche ? (
                                        <Link href={`/dashboard/hives/${reine.ruche.id}`} className="flex items-center gap-1.5 hover:text-green-600">
                                            <Hexagon className="h-3 w-3 text-green-600" />
                                            <span className="text-sm">{reine.ruche.immatriculation}</span>
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-gray-400">Sans ruche</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {reine.ruche?.rucher ? (
                                        <Link href={`/dashboard/apiaries/${reine.ruche.rucher.id}`} className="flex items-center gap-1.5 hover:text-amber-600">
                                            <MapPin className="h-3 w-3 text-amber-600" />
                                            <span className="text-sm">{reine.ruche.rucher.nom}</span>
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={getStatutColor('ACTIVE')}>
                                        {getStatutLabel('ACTIVE')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-1">
                                        <Link href={`/dashboard/reines/${reine.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                onClick={() => setEditingReineId(reine.id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteConfirmId(reine.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {canEdit && editingReineId && (
                <EditReineDialog
                    reineId={editingReineId}
                    open={!!editingReineId}
                    onOpenChange={(open) => !open && setEditingReineId(null)}
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
