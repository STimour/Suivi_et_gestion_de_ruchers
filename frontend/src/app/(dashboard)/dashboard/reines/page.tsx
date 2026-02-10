'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LayoutGrid, List, Plus, AlertTriangle, Search, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { GET_REINES, GET_REINES_ELEVAGE } from '@/lib/graphql/queries/reine.queries';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { DELETE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { CreateReineDialog } from '@/components/reine/CreateReineDialog';
import { ReineList } from '@/components/reine/ReineList';
import { ReineGrid } from '@/components/reine/ReineGrid';
import { useCanEdit } from '@/hooks/useCanEdit';
import { useQuota } from '@/hooks/useQuota';
import { useProfileMode } from '@/lib/context/ProfileModeContext';

type ViewMode = 'grid' | 'list';

export default function ReinesPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [rucherFilter, setRucherFilter] = useState<string>('all');
    const [statutFilter, setStatutFilter] = useState<string>('all');

    const { isEleveur } = useProfileMode();
    const canEdit = useCanEdit();
    const { canCreateReine } = useQuota();
    const { data, loading, error, refetch } = useQuery<any>(isEleveur ? GET_REINES_ELEVAGE : GET_REINES);
    const { data: ruchersData } = useQuery<any>(GET_RUCHERS);

    const [deleteReine] = useMutation(DELETE_REINE, {
        onCompleted: () => {
            toast.success('Reine supprimée avec succès');
            refetch();
        },
        onError: (error) => {
            toast.error('Erreur lors de la suppression', {
                description: error.message,
            });
        },
    });

    const handleDelete = (id: string) => {
        deleteReine({ variables: { id } });
    };

    const filteredReines = data?.reines?.filter((reine: any) => {
        const q = searchQuery.toLowerCase();
        // Search filter
        const matchesSearch = !searchQuery ||
            reine.lignee?.toLowerCase().includes(q) ||
            reine.codeCouleur?.toLowerCase().includes(q) ||
            String(reine.anneeNaissance).includes(searchQuery) ||
            (isEleveur
                ? reine.racle?.reference?.toLowerCase().includes(q)
                : (reine.ruche?.immatriculation?.toLowerCase().includes(q) ||
                   reine.ruche?.rucher?.nom?.toLowerCase().includes(q)));

        // Rucher filter (only in apiculteur mode)
        const matchesRucher = isEleveur || rucherFilter === 'all' ||
            reine.ruche?.rucher?.id === rucherFilter;

        // Statut filter
        const matchesStatut = statutFilter === 'all' || reine.statut === statutFilter;

        return matchesSearch && matchesRucher && matchesStatut;
    }) || [];

    const totalReines = data?.reines?.length || 0;
    const reinesAvecRuche = data?.reines?.filter((r: any) => r.ruche)?.length || 0;
    const reinesSansRuche = totalReines - reinesAvecRuche;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-2">
                        <Crown className="h-8 w-8 text-amber-600" />
                        Gestion des reines
                    </h1>
                    <p className="text-amber-700/70 mt-1">
                        {totalReines} reines au total • {reinesAvecRuche} avec ruche • {reinesSansRuche} sans ruche
                    </p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        {canCreateReine ? (
                            <CreateReineDialog
                                trigger={
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm">
                                        <Plus className="h-4 w-4" />
                                        Nouvelle reine
                                    </Button>
                                }
                            />
                        ) : (
                            <Button className="bg-amber-600 text-white gap-2 shadow-sm" disabled>
                                <Plus className="h-4 w-4" />
                                Nouvelle reine (limite Freemium atteinte)
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher une reine..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                        />
                    </div>
                    {!isEleveur && (
                        <Select value={rucherFilter} onValueChange={setRucherFilter}>
                            <SelectTrigger className="w-full sm:w-44 border-amber-200">
                                <SelectValue placeholder="Rucher" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">Tous les ruchers</SelectItem>
                                {ruchersData?.ruchers?.map((rucher: any) => (
                                    <SelectItem key={rucher.id} value={rucher.id}>
                                        {rucher.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={statutFilter} onValueChange={setStatutFilter}>
                        <SelectTrigger className="w-full sm:w-40 border-amber-200">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="Fecondee">Fécondée</SelectItem>
                            <SelectItem value="NonFecondee">Non fécondée</SelectItem>
                            <SelectItem value="DisponibleVente">Dispo. vente</SelectItem>
                            <SelectItem value="Vendu">Vendue</SelectItem>
                            <SelectItem value="Perdue">Perdue</SelectItem>
                            <SelectItem value="Eliminee">Éliminée</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 p-1 rounded-md border border-amber-200">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`h-8 px-3 ${viewMode === 'grid' ? 'shadow-sm text-amber-900 bg-white hover:bg-white' : 'text-amber-700 hover:text-amber-900'}`}
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Grille
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`h-8 px-3 ${viewMode === 'list' ? 'shadow-sm text-amber-900 bg-white hover:bg-white' : 'text-amber-700 hover:text-amber-900'}`}
                    >
                        <List className="h-4 w-4 mr-2" />
                        Liste
                    </Button>
                </div>
            </div>

            {/* Future features placeholder */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium">Fonctionnalités à venir :</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Cycle</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Généalogie</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Historique</span>
                </div>
            </div>

            {/* Content */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des reines : {error.message}
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                viewMode === 'list' ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <Skeleton className="h-52 w-full rounded-lg" />
                        <Skeleton className="h-52 w-full rounded-lg" />
                        <Skeleton className="h-52 w-full rounded-lg" />
                        <Skeleton className="h-52 w-full rounded-lg" />
                    </div>
                )
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <ReineList reines={filteredReines} onDelete={handleDelete} isEleveur={isEleveur} />
                    ) : (
                        <ReineGrid reines={filteredReines} onDelete={handleDelete} isEleveur={isEleveur} />
                    )}

                    {!loading && filteredReines.length === 0 && (searchQuery || rucherFilter !== 'all' || statutFilter !== 'all') && (
                        <div className="text-center py-12">
                            <p className="text-amber-700/70">Aucune reine ne correspond à vos critères.</p>
                            <Button
                                variant="link"
                                className="text-amber-600"
                                onClick={() => {
                                    setSearchQuery('');
                                    setRucherFilter('all');
                                    setStatutFilter('all');
                                }}
                            >
                                Effacer les filtres
                            </Button>
                        </div>
                    )}

                    {!loading && data?.reines?.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-amber-200">
                            <Crown className="h-12 w-12 mx-auto mb-3 text-amber-200" />
                            <p className="text-amber-700/70 mb-4">Aucune reine pour le moment</p>
                            {canEdit && canCreateReine && (
                                <CreateReineDialog
                                    trigger={
                                        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                            <Plus className="h-4 w-4" />
                                            Ajouter une reine
                                        </Button>
                                    }
                                />
                            )}
                            {canEdit && !canCreateReine && (
                                <Button className="bg-amber-600 text-white gap-2" disabled>
                                    <Plus className="h-4 w-4" />
                                    Ajouter une reine (limite Freemium atteinte)
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
