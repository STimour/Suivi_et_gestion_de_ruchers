'use client';

import { useQuery } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Hexagon,
    MapPin,
    Shield,
    ShieldOff,
    Crown,
    ArrowLeft,
    Calendar,
    ClipboardList,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { GET_RUCHE_BY_ID } from '@/lib/graphql/queries/ruche.queries';
import { AddInterventionDialog } from '@/components/ruche/AddInterventionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface RucheData {
    ruches_by_pk: {
        id: string;
        immatriculation: string;
        type: string;
        race: string;
        statut: string;
        maladie?: string;
        securisee: boolean;
        created_at?: string;
        updated_at?: string;
        rucher?: {
            id: string;
            nom: string;
            latitude?: number;
            longitude?: number;
        };
        reine?: {
            id: string;
            anneeNaissance: number;
            codeCouleur?: string;
            lignee?: string;
            noteDouceur?: number;
            commentaire?: string;
            nonReproductible?: boolean;
        };
        interventions?: Array<{
            id: string;
            type: string;
            date: string;
            observations?: string;
            produit?: string;
            dosage?: string;
            nbHausses?: number;
            poidsKg?: number;
        }>;
        capteurs?: Array<{
            id: string;
            type: string;
            identifiant: string;
            actif: boolean;
            batteriePct?: number;
            derniereCommunication?: string;
        }>;
    };
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

const getInterventionColor = (type: string) => {
    switch (type) {
        case 'Visite':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Nourrissement':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Traitement':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Recolte':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'Division':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'PoseHausse':
            return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'ControleSanitaire':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function RucheDetailPage() {
    const params = useParams();
    const router = useRouter();
    const rucheId = params.id as string;

    const { data, loading, error } = useQuery<RucheData>(GET_RUCHE_BY_ID, {
        variables: { id: rucheId },
        skip: !rucheId,
    });

    if (loading) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !data?.ruches_by_pk) {
        return (
            <div className="container mx-auto py-8">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-800">
                            Erreur lors du chargement de la ruche ou ruche introuvable.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push('/dashboard/hives')}
                        >
                            Retour à la liste
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const ruche = data.ruches_by_pk;
    const interventions = ruche.interventions || [];

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/hives')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-green-900 flex items-center gap-3">
                            <Hexagon className="h-8 w-8 text-green-600" />
                            Ruche {ruche.immatriculation}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Créée le {ruche.created_at ? formatDate(ruche.created_at) : '-'}
                        </p>
                    </div>
                </div>
                <AddInterventionDialog
                    rucheId={ruche.id}
                    rucheImmatriculation={ruche.immatriculation}
                />
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informations générales */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Hexagon className="h-5 w-5 text-green-600" />
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500">Immatriculation</span>
                                <p className="font-mono font-bold text-lg text-green-900">
                                    {ruche.immatriculation}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Statut</span>
                                <div className="mt-1">
                                    <Badge className={getStatutColor(ruche.statut)}>
                                        {ruche.statut}
                                    </Badge>
                                    {ruche.statut === 'Malade' && ruche.maladie && (
                                        <div className="flex items-center gap-1 mt-2 text-sm text-red-600 font-medium">
                                            <AlertTriangle className="h-4 w-4" />
                                            {ruche.maladie}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Type</span>
                                <p className="font-medium text-gray-900">{ruche.type}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Race d'abeille</span>
                                <p className="font-medium text-gray-900">{ruche.race}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Sécurité</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {ruche.securisee ? (
                                        <>
                                            <Shield className="h-5 w-5 text-green-600" />
                                            <span className="text-green-700 font-medium">
                                                Sécurisée
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldOff className="h-5 w-5 text-gray-400" />
                                            <span className="text-gray-600">Non sécurisée</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {ruche.rucher && (
                                <div>
                                    <span className="text-sm text-gray-500">Rucher</span>
                                    <Link
                                        href={`/dashboard/apiaries/${ruche.rucher.id}`}
                                        className="flex items-center gap-2 mt-1 text-amber-700 hover:text-amber-600 font-medium"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        {ruche.rucher.nom}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Reine */}
                {ruche.reine && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-600" />
                                Reine
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <span className="text-sm text-gray-500">Année de naissance</span>
                                <p className="font-bold text-lg text-amber-900">
                                    {ruche.reine.anneeNaissance}
                                </p>
                            </div>
                            {ruche.reine.codeCouleur && (
                                <div>
                                    <span className="text-sm text-gray-500">Code couleur</span>
                                    <p className="font-medium text-gray-900">
                                        {ruche.reine.codeCouleur}
                                    </p>
                                </div>
                            )}
                            {ruche.reine.lignee && (
                                <div>
                                    <span className="text-sm text-gray-500">Lignée</span>
                                    <p className="font-medium text-gray-900">
                                        {ruche.reine.lignee}
                                    </p>
                                </div>
                            )}
                            {ruche.reine.noteDouceur !== null && (
                                <div>
                                    <span className="text-sm text-gray-500">Note de douceur</span>
                                    <p className="font-medium text-gray-900">
                                        {ruche.reine.noteDouceur}/10
                                    </p>
                                </div>
                            )}
                            {ruche.reine.commentaire && (
                                <div>
                                    <span className="text-sm text-gray-500">Commentaire</span>
                                    <p className="text-sm text-gray-700">
                                        {ruche.reine.commentaire}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Historique des interventions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-green-600" />
                        Historique des interventions ({interventions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {interventions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune intervention enregistrée pour cette ruche.</p>
                            <AddInterventionDialog
                                rucheId={ruche.id}
                                rucheImmatriculation={ruche.immatriculation}
                                trigger={
                                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                                        Ajouter une intervention
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-green-50/50">
                                    <TableRow>
                                        <TableHead className="w-[140px]">Date et heure</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Produit</TableHead>
                                        <TableHead>Dosage</TableHead>
                                        <TableHead className="text-center">Poids (kg)</TableHead>
                                        <TableHead className="text-center">Hausses</TableHead>
                                        <TableHead>Observations</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {interventions.map((intervention: any) => (
                                        <TableRow key={intervention.id} className="hover:bg-green-50/30">
                                            <TableCell className="font-medium text-sm whitespace-nowrap">
                                                {formatDateTime(intervention.date)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getInterventionColor(intervention.type)}>
                                                    {intervention.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {intervention.produit || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {intervention.dosage || '-'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm">
                                                {intervention.poidsKg ? `${intervention.poidsKg} kg` : '-'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm">
                                                {intervention.nbHausses || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs">
                                                {intervention.observations ? (
                                                    <span className="line-clamp-2 text-gray-600">
                                                        {intervention.observations}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
