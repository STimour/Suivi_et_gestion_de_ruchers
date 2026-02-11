'use client';

import { useQuery } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Crown,
    MapPin,
    Hexagon,
    ArrowLeft,
    Calendar,
    MessageSquare,
    Lock,
} from 'lucide-react';
import Link from 'next/link';
import { GET_REINE_BY_ID } from '@/lib/graphql/queries/reine.queries';
import { Skeleton } from '@/components/ui/skeleton';

interface ReineData {
    reines_by_pk: {
        id: string;
        anneeNaissance: number;
        codeCouleur?: string;
        lignee?: string;
        noteDouceur?: number;
        commentaire?: string;
        nonReproductible?: boolean;
        created_at?: string;
        updated_at?: string;
        ruche?: {
            id: string;
            immatriculation: string;
            type: string;
            statut: string;
            rucher?: {
                id: string;
                nom: string;
            };
        };
        entreprise?: {
            id: string;
            nom: string;
        };
    };
}

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
        year: 'numeric',
    });
};

export default function ReineDetailPage() {
    const params = useParams();
    const router = useRouter();
    const reineId = params.id as string;

    const { data, loading, error } = useQuery<ReineData>(GET_REINE_BY_ID, {
        variables: { id: reineId },
        skip: !reineId,
    });

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !data?.reines_by_pk) {
        return (
            <div className="container mx-auto py-8">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-800">
                            Erreur lors du chargement de la reine ou reine introuvable.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push('/dashboard/reines')}
                        >
                            Retour à la liste
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const reine = data.reines_by_pk;

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/reines')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-amber-900 flex items-center gap-3">
                            <Crown className="h-8 w-8 text-amber-600" />
                            Reine {reine.anneeNaissance}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Ajoutée le {reine.created_at ? formatDate(reine.created_at) : '-'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-amber-200"
                        onClick={() => router.push('/dashboard/reines')}
                    >
                        Modifier
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informations principales */}
                <Card className="border-amber-200 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <Crown className="h-5 w-5" />
                            Informations de la reine
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Année de naissance</p>
                                <p className="font-semibold text-lg text-amber-900">{reine.anneeNaissance}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Code couleur</p>
                                {reine.codeCouleur ? (
                                    <Badge className={getColorBadge(reine.codeCouleur)}>
                                        {reine.codeCouleur}
                                    </Badge>
                                ) : (
                                    <p className="text-gray-400">Non renseigné</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Lignée</p>
                                <p className="font-medium">{reine.lignee || 'Non renseignée'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Note douceur</p>
                                <p className="font-medium">{reine.noteDouceur ?? '-'} / 10</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Reproductible</p>
                                <Badge variant={reine.nonReproductible ? 'destructive' : 'default'}>
                                    {reine.nonReproductible ? 'Non' : 'Oui'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Statut</p>
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                        </div>

                        {/* Notes */}
                        {reine.commentaire && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    Notes
                                </p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{reine.commentaire}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ruche associée */}
                <Card className="border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                            <Hexagon className="h-5 w-5" />
                            Ruche associée
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reine.ruche ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <Hexagon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-green-900">{reine.ruche.immatriculation}</p>
                                        <p className="text-sm text-gray-500">{reine.ruche.type}</p>
                                    </div>
                                </div>

                                {reine.ruche.rucher && (
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <MapPin className="h-4 w-4" />
                                        <Link href={`/dashboard/apiaries/${reine.ruche.rucher.id}`} className="hover:underline">
                                            {reine.ruche.rucher.nom}
                                        </Link>
                                    </div>
                                )}

                                <Link href={`/dashboard/hives/${reine.ruche.id}`}>
                                    <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">
                                        Voir la ruche
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Hexagon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>Aucune ruche associée</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
