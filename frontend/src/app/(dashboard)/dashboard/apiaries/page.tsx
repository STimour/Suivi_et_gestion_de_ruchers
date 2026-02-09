'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LayoutGrid, List, Plus, AlertTriangle, Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { CreateRucherDialog } from '@/components/rucher/RucherDialog';
import { RucherList } from '@/components/rucher/RucherList';
import { RucherGrid } from '@/components/rucher/RucherGrid';
import { useCanEdit } from '@/hooks/useCanEdit';
import { useQuota } from '@/hooks/useQuota';

type ViewMode = 'grid' | 'list';

export default function ApiariesPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const canEdit = useCanEdit();
    const { canCreateRucher } = useQuota();
    const { data, loading, error } = useQuery<any>(GET_RUCHERS);

    const filteredRuchers = data?.ruchers?.filter((rucher: any) =>
        rucher.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rucher.ville?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900">Mes Ruchers</h1>
                    <p className="text-amber-700/70 mt-1">
                        Gérez vos emplacements et suivez l'état de vos ruches
                    </p>
                </div>
                {canEdit && canCreateRucher && (
                    <CreateRucherDialog
                        trigger={
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm">
                                <Plus className="h-4 w-4" />
                                Nouveau rucher
                            </Button>
                        }
                    />
                )}
                {canEdit && !canCreateRucher && (
                    <Button className="bg-amber-600 text-white gap-2 shadow-sm" disabled>
                        <Plus className="h-4 w-4" />
                        Nouveau rucher (limite Freemium atteinte)
                    </Button>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un rucher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    />
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

            {/* Content */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des ruchers : {error.message}
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                viewMode === 'list' ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                )
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <RucherList ruchers={filteredRuchers} />
                    ) : (
                        <RucherGrid ruchers={filteredRuchers} />
                    )}

                    {!loading && filteredRuchers.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-amber-200">
                            <MapPin className="h-12 w-12 mx-auto mb-3 text-amber-200" />
                            <p className="text-amber-700/70">Aucun rucher pour le moment</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
