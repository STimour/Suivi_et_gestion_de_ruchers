'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Flower2, Mountain, Pencil, Trash2 } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import { RucherMiniMapWrapper } from "./RucherMiniMapWrapper";
import { EditRucherDialog } from './EditRucherDialog';
import { useCanEdit } from '@/hooks/useCanEdit';
import { DELETE_RUCHER } from '@/lib/graphql/mutations/rucher.mutations';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
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

interface RucherGridProps {
    ruchers: any[];
}

export function RucherGrid({ ruchers }: RucherGridProps) {
    const [editingRucherId, setEditingRucherId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const canEdit = useCanEdit();

    const deleteConfirmRucher = ruchers.find(r => r.id === deleteConfirmId);

    const [deleteRucher, { loading: deleteLoading }] = useMutation(DELETE_RUCHER, {
        refetchQueries: [{ query: GET_RUCHERS }],
        onCompleted: () => {
            toast.success("Rucher supprimé avec succès");
            setDeleteConfirmId(null);
        },
        onError: (error) => {
            toast.error("Erreur lors de la suppression", {
                description: error.message,
            });
        },
    });

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) {
            deleteRucher({ variables: { id: deleteConfirmId } });
        }
    };

    if (ruchers.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ruchers.map((rucher) => (
                    <Card key={rucher.id} className="group hover:shadow-lg transition-all duration-300 border-amber-200 hover:border-amber-400 bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-amber-900 line-clamp-1" title={rucher.nom}>
                                    {rucher.nom}
                                </CardTitle>
                                <div className="flex items-center gap-1 text-xs text-amber-700/70">
                                    <MapPin className="h-3 w-3" />
                                    {rucher.latitude.toFixed(4)}, {rucher.longitude.toFixed(4)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="mb-4 h-32 rounded-md overflow-hidden">
                                <RucherMiniMapWrapper
                                    latitude={rucher.latitude}
                                    longitude={rucher.longitude}
                                    nom={rucher.nom}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Flower2 className="h-4 w-4 text-green-500" />
                                    <span className="truncate" title={rucher.flore}>{rucher.flore}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mountain className="h-4 w-4 text-gray-400" />
                                    <span>{rucher.altitude}m</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t border-amber-100 flex items-center justify-center gap-1 flex-wrap">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                {rucher.ruches?.length || 0} ruches
                            </Badge>
                            {canEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => setEditingRucherId(rucher.id)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteConfirmId(rucher.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Link href={`/dashboard/apiaries/${rucher.id}`}>
                                <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50">
                                    Voir détails
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {canEdit && editingRucherId && (
                <EditRucherDialog
                    rucherId={editingRucherId}
                    open={!!editingRucherId}
                    onOpenChange={(open) => !open && setEditingRucherId(null)}
                />
            )}

            {canEdit && (
                <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le rucher ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le rucher <span className="font-semibold">{deleteConfirmRucher?.nom}</span> ?
                                Cette action est irréversible et supprimera toutes les ruches associées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteConfirm();
                                }}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Suppression..." : "Supprimer"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
