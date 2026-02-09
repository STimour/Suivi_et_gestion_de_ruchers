'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LayoutGrid, List, Plus, AlertTriangle, Search, Upload, Hexagon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { CreateRucheDialog } from '@/components/ruche/CreateRucheDialog';
import { BulkCreateRuchesDialog } from '@/components/ruche/BulkCreateRuchesDialog';
import { RucheList } from '@/components/ruche/RucheList';
import { RucheGrid } from '@/components/ruche/RucheGrid';

type ViewMode = 'grid' | 'list';

export default function HivesPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statutFilter, setStatutFilter] = useState<string>('all');

    const { data, loading, error } = useQuery<any>(GET_RUCHES);

    const filteredRuches = data?.ruches?.filter((ruche: any) => {
        const matchesSearch = ruche.immatriculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ruche.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ruche.race?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ruche.rucher?.nom?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatut = statutFilter === 'all' || ruche.statut === statutFilter;

        return matchesSearch && matchesStatut;
    }) || [];

    const totalRuches = data?.ruches?.length || 0;
    const ruchesActives = data?.ruches?.filter((r: any) => r.statut === 'Active')?.length || 0;
    const ruchesMalades = data?.ruches?.filter((r: any) => r.statut === 'Malade')?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-2">
                        <Hexagon className="h-8 w-8 text-green-600" />
                        Mes Ruches
                    </h1>
                    <p className="text-amber-700/70 mt-1">
                        {totalRuches} ruches au total • {ruchesActives} actives • {ruchesMalades} alertes
                    </p>
                </div>
                <div className="flex gap-2">
                    <CreateRucheDialog
                        trigger={
                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm">
                                <Plus className="h-4 w-4" />
                                Nouvelle ruche
                            </Button>
                        }
                    />
                    <BulkCreateRuchesDialog
                        trigger={
                            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 gap-2">
                                <Upload className="h-4 w-4" />
                                Import masse
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher une ruche..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 border-green-200 focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <Select value={statutFilter} onValueChange={setStatutFilter}>
                        <SelectTrigger className="w-full sm:w-40 border-green-200">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Faible">Faible</SelectItem>
                            <SelectItem value="Malade">Malade</SelectItem>
                            <SelectItem value="Morte">Morte</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 bg-green-50 p-1 rounded-md border border-green-200">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`h-8 px-3 ${viewMode === 'grid' ? 'shadow-sm text-green-900 bg-white hover:bg-white' : 'text-green-700 hover:text-green-900'}`}
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Grille
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`h-8 px-3 ${viewMode === 'list' ? 'shadow-sm text-green-900 bg-white hover:bg-white' : 'text-green-700 hover:text-green-900'}`}
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
                        Erreur lors du chargement des ruches : {error.message}
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
                        <RucheList ruches={filteredRuches} />
                    ) : (
                        <RucheGrid ruches={filteredRuches} />
                    )}

                    {!loading && filteredRuches.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-green-200">
                            <Hexagon className="h-12 w-12 mx-auto mb-3 text-green-200" />
                            <p className="text-amber-700/70">Aucune ruche pour le moment</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
