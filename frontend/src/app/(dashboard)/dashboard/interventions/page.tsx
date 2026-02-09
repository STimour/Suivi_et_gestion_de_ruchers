'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Search, ClipboardList, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { GET_INTERVENTIONS } from '@/lib/graphql/queries/intervention.queries';
import { DELETE_INTERVENTION } from '@/lib/graphql/mutations/intervention.mutations';
import { TYPE_INTERVENTION_OPTIONS } from '@/lib/constants/ruche.constants';
import { getInterventionTypeStyle, INTERVENTION_TYPE_CONFIG } from '@/lib/constants/intervention.constants';
import { InterventionTable } from '@/components/intervention/InterventionTable';

export default function InterventionsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const { data, loading, error, refetch } = useQuery<any>(GET_INTERVENTIONS);

    const [deleteIntervention] = useMutation(DELETE_INTERVENTION, {
        onCompleted: () => {
            toast.success('Intervention supprimée avec succès');
            refetch();
        },
        onError: (err) => {
            toast.error('Erreur lors de la suppression', {
                description: err.message,
            });
        },
    });

    const handleDelete = (id: string) => {
        deleteIntervention({ variables: { id } });
    };

    const interventions = data?.interventions || [];

    const filteredInterventions = useMemo(() => {
        return interventions.filter((intervention: any) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                intervention.type?.toLowerCase().includes(q) ||
                intervention.observations?.toLowerCase().includes(q) ||
                intervention.produit?.toLowerCase().includes(q) ||
                intervention.ruch?.immatriculation?.toLowerCase().includes(q) ||
                intervention.ruch?.rucher?.nom?.toLowerCase().includes(q);

            const matchesType = typeFilter === 'all' || intervention.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [interventions, searchQuery, typeFilter]);

    // Stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalInterventions = interventions.length;
    const last7Days = interventions.filter((i: any) => new Date(i.date) >= sevenDaysAgo).length;
    const last30Days = interventions.filter((i: any) => new Date(i.date) >= thirtyDaysAgo).length;

    const typeBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        interventions.forEach((i: any) => {
            counts[i.type] = (counts[i.type] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [interventions]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-amber-600" />
                    Interventions
                </h1>
                <p className="text-amber-700/70 mt-1">
                    {totalInterventions} intervention{totalInterventions !== 1 ? 's' : ''} au total
                    {' '}&bull; {last7Days} ces 7 derniers jours
                    {' '}&bull; {last30Days} ces 30 derniers jours
                </p>
            </div>

            {/* Stats Cards */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <ClipboardList className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-700/70">Total</p>
                                <p className="text-2xl font-bold text-amber-900">{totalInterventions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-700/70">7 derniers jours</p>
                                <p className="text-2xl font-bold text-amber-900">{last7Days}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-700/70">30 derniers jours</p>
                                <p className="text-2xl font-bold text-amber-900">{last30Days}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-50 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-violet-600" />
                            </div>
                            <p className="text-sm text-amber-700/70">Par type</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {typeBreakdown.length === 0 && (
                                <span className="text-sm text-gray-400">Aucune donnée</span>
                            )}
                            {typeBreakdown.map(([type, count]) => {
                                const style = getInterventionTypeStyle(type);
                                return (
                                    <Badge key={type} className={`${style.badgeClass} text-xs`}>
                                        {style.label}: {count}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher une intervention..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-amber-200">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les types</SelectItem>
                        {TYPE_INTERVENTION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Future interventions placeholder */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 opacity-60">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium">Fonctionnalités à venir :</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Interventions futures planifiées</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Rappels automatiques</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Export PDF</span>
                </div>
            </div>

            {/* Content */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des interventions : {error.message}
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <>
                    <InterventionTable interventions={filteredInterventions} onDelete={handleDelete} />

                    {!loading && filteredInterventions.length === 0 && (searchQuery || typeFilter !== 'all') && interventions.length > 0 && (
                        <div className="text-center py-12">
                            <p className="text-amber-700/70">Aucune intervention ne correspond à vos critères.</p>
                            <button
                                className="text-amber-600 hover:underline text-sm mt-2"
                                onClick={() => {
                                    setSearchQuery('');
                                    setTypeFilter('all');
                                }}
                            >
                                Effacer les filtres
                            </button>
                        </div>
                    )}

                    {!loading && interventions.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-amber-200">
                            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-amber-200" />
                            <p className="text-amber-700/70">Aucune intervention pour le moment</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Les interventions enregistrées depuis les fiches ruches apparaîtront ici.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
