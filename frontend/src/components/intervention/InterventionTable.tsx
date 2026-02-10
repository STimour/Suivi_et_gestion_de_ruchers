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
import { Hexagon, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { getInterventionTypeStyle } from '@/lib/constants/intervention.constants';
import { useCanEdit } from '@/hooks/useCanEdit';

interface InterventionTableProps {
    interventions: any[];
    onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function getDetails(intervention: any): string {
    const parts: string[] = [];
    if (intervention.produit) parts.push(intervention.produit);
    if (intervention.dosage) parts.push(intervention.dosage);
    if (intervention.poidsKg != null) parts.push(`${intervention.poidsKg} kg`);
    if (intervention.nbHausses != null) parts.push(`${intervention.nbHausses} hausse(s)`);
    return parts.join(' · ') || '—';
}

export function InterventionTable({ interventions, onDelete }: InterventionTableProps) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const canEdit = useCanEdit();

    if (interventions.length === 0) {
        return null;
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
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Ruche</TableHead>
                            <TableHead>Rucher</TableHead>
                            <TableHead>Détails</TableHead>
                            <TableHead>Observations</TableHead>
                            {canEdit && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interventions.map((intervention) => {
                            const style = getInterventionTypeStyle(intervention.type);
                            const Icon = style.icon;
                            return (
                                <TableRow key={intervention.id} className="hover:bg-amber-50/30">
                                    <TableCell className="font-medium text-amber-900 whitespace-nowrap">
                                        {formatDate(intervention.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${style.badgeClass} gap-1`}>
                                            <Icon className="h-3 w-3" />
                                            {style.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {intervention.ruch ? (
                                            <Link href={`/dashboard/hives/${intervention.ruch.id}`} className="flex items-center gap-1.5 hover:text-green-600">
                                                <Hexagon className="h-3 w-3 text-green-600" />
                                                <span className="text-sm">{intervention.ruch.immatriculation}</span>
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {intervention.ruch?.rucher ? (
                                            <Link href={`/dashboard/apiaries/${intervention.ruch.rucher.id}`} className="flex items-center gap-1.5 hover:text-amber-600">
                                                <MapPin className="h-3 w-3 text-amber-600" />
                                                <span className="text-sm">{intervention.ruch.rucher.nom}</span>
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                                        {getDetails(intervention)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                                        {intervention.observations || '—'}
                                    </TableCell>
                                    {canEdit && (
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteConfirmId(intervention.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {canEdit && (
                <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.
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
