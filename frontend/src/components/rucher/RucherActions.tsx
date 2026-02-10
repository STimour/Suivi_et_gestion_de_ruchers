'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { DELETE_RUCHER } from '@/lib/graphql/mutations/rucher.mutations';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { EditRucherDialog } from './EditRucherDialog';
import { useCanEdit } from '@/hooks/useCanEdit';

interface RucherActionsProps {
    rucherId: string;
    rucherNom: string;
}

export function RucherActions({ rucherId, rucherNom }: RucherActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const router = useRouter();
    const canEdit = useCanEdit();

    const [deleteRucher, { loading: deleteLoading }] = useMutation(DELETE_RUCHER, {
        refetchQueries: [{ query: GET_RUCHERS }],
        onCompleted: () => {
            toast.success("Rucher supprimé avec succès");
            setShowDeleteDialog(false);
        },
        onError: (error) => {
            toast.error("Erreur lors de la suppression", {
                description: error.message
            });
        }
    });

    const handleDelete = () => {
        deleteRucher({
            variables: { id: rucherId }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                    <Link href={`/dashboard/apiaries/${rucherId}`}>
                        <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4 text-amber-600" />
                            Voir
                        </DropdownMenuItem>
                    </Link>
                    {canEdit && (
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setShowEditDialog(true)}
                        >
                            <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                            Modifier
                        </DropdownMenuItem>
                    )}
                    {canEdit && (
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {canEdit && (
                <EditRucherDialog
                    rucherId={rucherId}
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                />
            )}

            {canEdit && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le rucher ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le rucher <span className="font-semibold">{rucherNom}</span> ?
                                Cette action est irréversible et supprimera toutes les ruches associées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
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
