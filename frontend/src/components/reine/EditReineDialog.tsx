'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Crown, Loader2 } from 'lucide-react';
import { UPDATE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { GET_REINE_BY_ID, GET_REINES } from '@/lib/graphql/queries/reine.queries';
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';

// Options de couleur (cycle international 5 ans)
const COLOR_OPTIONS = [
    { value: 'Blanc', label: 'Blanc (années en 1 ou 6)' },
    { value: 'Jaune', label: 'Jaune (années en 2 ou 7)' },
    { value: 'Rouge', label: 'Rouge (années en 3 ou 8)' },
    { value: 'Vert', label: 'Vert (années en 4 ou 9)' },
    { value: 'Bleu', label: 'Bleu (années en 5 ou 0)' },
];

// Statuts possibles
const STATUT_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'LOST', label: 'Perdue' },
    { value: 'REPLACED', label: 'Remplacée' },
    { value: 'DEAD', label: 'Morte' },
];

// Interface pour typer les données de la reine
interface ReineData {
    reines_by_pk: {
        id: string;
        anneeNaissance: number;
        codeCouleur?: string;
        lignee?: string;
        noteDouceur?: number;
        commentaire?: string;
        nonReproductible?: boolean;
        ruche?: {
            id: string;
            immatriculation: string;
            rucher?: {
                id: string;
                nom: string;
            };
        };
    };
}

// Schéma de validation
const reineSchema = z.object({
    anneeNaissance: z.number({ message: 'L\'année est requise' })
        .int('L\'année doit être un entier')
        .min(2000, 'Minimum 2000')
        .max(new Date().getFullYear(), 'Année invalide'),
    codeCouleur: z.string().optional(),
    lignee: z.string().max(100, 'La lignée est trop longue').optional(),
    rucheId: z.string().optional(),
    noteDouceur: z.number({ message: 'La note est requise' })
        .int('La note doit être un entier')
        .min(1, 'Minimum 1')
        .max(10, 'Maximum 10'),
    statut: z.string().min(1, 'Le statut est requis'),
    commentaire: z.string().max(500, 'Les notes sont trop longues').optional(),
});

type ReineFormValues = z.infer<typeof reineSchema>;

interface EditReineDialogProps {
    reineId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditReineDialog({ reineId, open, onOpenChange }: EditReineDialogProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Récupérer les données de la reine
    const { data: reineData, loading: fetchLoading } = useQuery<ReineData>(GET_REINE_BY_ID, {
        variables: { id: reineId },
        skip: !open,
        fetchPolicy: 'network-only',
    });

    // Récupérer la liste des ruches pour le select
    const { data: ruchesData } = useQuery<any>(GET_RUCHES);

    const [updateReine, { loading: updateLoading }] = useMutation(UPDATE_REINE, {
        refetchQueries: [{ query: GET_REINES }],
        onCompleted: () => {
            toast.success('Reine modifiée avec succès !');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Erreur lors de la modification de la reine', {
                description: error.message,
            });
        },
    });

    const form = useForm<ReineFormValues>({
        resolver: zodResolver(reineSchema),
        defaultValues: {
            anneeNaissance: new Date().getFullYear(),
            codeCouleur: '',
            lignee: '',
            rucheId: 'none',
            noteDouceur: 5,
            statut: 'ACTIVE',
            commentaire: '',
        },
    });

    // Charger les données de la reine dans le formulaire
    useEffect(() => {
        if (reineData?.reines_by_pk) {
            const reine = reineData.reines_by_pk;
            form.reset({
                anneeNaissance: reine.anneeNaissance,
                codeCouleur: reine.codeCouleur || '',
                lignee: reine.lignee || '',
                rucheId: reine.ruche?.id || 'none',
                noteDouceur: reine.noteDouceur ?? 5,
                statut: 'ACTIVE',
                commentaire: reine.commentaire || '',
            });
            setIsLoading(false);
        }
    }, [reineData, form]);

    const onSubmit = async (values: ReineFormValues) => {
        try {
            await updateReine({
                variables: {
                    id: reineId,
                    changes: {
                        anneeNaissance: values.anneeNaissance,
                        codeCouleur: values.codeCouleur || null,
                        lignee: values.lignee || null,
                        ruche_id: values.rucheId === 'none' ? null : values.rucheId,
                        noteDouceur: values.noteDouceur,
                        commentaire: values.commentaire || '',
                    },
                },
            });
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150 bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-900">
                        <Crown className="h-5 w-5" />
                        Modifier la reine
                    </DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de la reine.
                    </DialogDescription>
                </DialogHeader>

                {fetchLoading || isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="anneeNaissance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Année de naissance *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="2024"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="codeCouleur"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code couleur</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {COLOR_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="lignee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lignée</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Buckfast, Carnica, Noire..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rucheId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ruche associée</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="none">Aucune ruche</SelectItem>
                                                    {ruchesData?.ruches?.filter((ruche: any) => !ruche.reine || ruche.id === reineData?.reines_by_pk?.ruche?.id).map((ruche: any) => (
                                                        <SelectItem key={ruche.id} value={ruche.id}>
                                                            {ruche.immatriculation} {ruche.rucher?.nom ? `(${ruche.rucher.nom})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="statut"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Statut *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {STATUT_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="noteDouceur"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Note de douceur * (1-10)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                placeholder="5"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="commentaire"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Observations, remarques..."
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Section Future Features - Disabled placeholders */}
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Fonctionnalités à venir</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                                        <p className="text-sm font-medium text-gray-400">Cycle</p>
                                        <p className="text-xs text-gray-300">Indisponible</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                                        <p className="text-sm font-medium text-gray-400">Généalogie</p>
                                        <p className="text-xs text-gray-300">Indisponible</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                                        <p className="text-sm font-medium text-gray-400">Historique</p>
                                        <p className="text-xs text-gray-300">Indisponible</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={updateLoading}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-amber-600 hover:bg-amber-700"
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
