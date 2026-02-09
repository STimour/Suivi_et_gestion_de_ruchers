import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hexagon, MapPin, Shield, ShieldOff, Crown, Pencil, Trash2, AlertTriangle, Calendar, ClipboardList } from "lucide-react";
import Link from 'next/link';
import { EditRucheDialog } from './EditRucheDialog';
import { AddInterventionDialog } from './AddInterventionDialog';
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

interface RucheGridProps {
    ruches: any[];
    onDelete: (id: string) => void;
}

const getStatutColor = (statut: string) => {
    switch (statut) {
        case 'Active':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'Faible':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Malade':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Morte':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatutBorderColor = (statut: string) => {
    switch (statut) {
        case 'Active':
            return 'border-green-200 hover:border-green-400';
        case 'Faible':
            return 'border-yellow-200 hover:border-yellow-400';
        case 'Malade':
            return 'border-red-200 hover:border-red-400';
        case 'Morte':
            return 'border-gray-200 hover:border-gray-400';
        default:
            return 'border-green-200 hover:border-green-400';
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function RucheGrid({ ruches, onDelete }: RucheGridProps) {
    const [editingRucheId, setEditingRucheId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const canEdit = useCanEdit();

    if (ruches.length === 0) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ruches.map((ruche) => (
                    <Card
                        key={ruche.id}
                        className={`group hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm ${getStatutBorderColor(ruche.statut)}`}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-mono font-bold text-green-900 flex items-center gap-2">
                                        <Hexagon className="h-5 w-5 text-green-600" />
                                        {ruche.immatriculation}
                                    </CardTitle>
                                    {ruche.rucher && (
                                        <Link href={`/dashboard/apiaries/${ruche.rucher.id}`} className="flex items-center gap-1 text-xs text-amber-700/70 hover:text-amber-600">
                                            <MapPin className="h-3 w-3" />
                                            {ruche.rucher.nom}
                                        </Link>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge className={getStatutColor(ruche.statut)}>
                                        {ruche.statut}
                                    </Badge>
                                    {ruche.statut === 'Malade' && ruche.maladie && (
                                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium animate-pulse">
                                            <AlertTriangle className="h-3 w-3" />
                                            {ruche.maladie}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-600">
                                        <span className="text-xs text-gray-400 block">Type</span>
                                        {ruche.type}
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="text-xs text-gray-400 block">Race</span>
                                        {ruche.race}
                                    </div>
                                </div>

                                {ruche.created_at && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Créée le {formatDate(ruche.created_at)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        {ruche.securisee ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Shield className="h-4 w-4" />
                                                <span className="text-xs">Sécurisée</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <ShieldOff className="h-4 w-4" />
                                                <span className="text-xs">Non sécurisée</span>
                                            </div>
                                        )}
                                    </div>
                                    {ruche.reine && (
                                        <div className="flex items-center gap-1 text-amber-600">
                                            <Crown className="h-4 w-4" />
                                            <span className="text-xs">{ruche.reine.anneeNaissance}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t border-gray-100 flex items-center justify-center gap-1 flex-wrap">
                            {canEdit && (
                                <AddInterventionDialog
                                    rucheId={ruche.id}
                                    rucheImmatriculation={ruche.immatriculation}
                                    trigger={
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <ClipboardList className="h-4 w-4 mr-1" />
                                            Intervention
                                        </Button>
                                    }
                                />
                            )}
                            {canEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => setEditingRucheId(ruche.id)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteConfirmId(ruche.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Link href={`/dashboard/hives/${ruche.id}`}>
                                <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50">
                                    Voir détails
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {canEdit && editingRucheId && (
                <EditRucheDialog
                    rucheId={editingRucheId}
                    open={!!editingRucheId}
                    onOpenChange={(open) => !open && setEditingRucheId(null)}
                />
            )}

            {canEdit && (
                <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette ruche ? Cette action est irréversible.
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
