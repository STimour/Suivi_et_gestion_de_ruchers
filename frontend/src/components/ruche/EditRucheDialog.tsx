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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Hexagon, Loader2 } from 'lucide-react';
import { UPDATE_RUCHE } from '@/lib/graphql/mutations/ruche.mutations';
import { GET_RUCHE_BY_ID, GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { useEnums } from '@/hooks/useEnums';

// Interface pour typer les données de la ruche
interface RucheData {
    ruches_by_pk: {
        id: string;
        immatriculation: string;
        type: string;
        statut: string;
        race: string;
        securisee: boolean;
        maladie?: string; // Ajout potentiel si supporté par le backend, sinon à gérer autrement
    };
}

// Schéma de validation
const rucheSchema = z.object({
    immatriculation: z.string().min(1, 'L\'immatriculation est requise'),
    type: z.string().min(1, 'Le type de ruche est requis'),
    statut: z.string().min(1, 'Le statut est requis'),
    race: z.string().min(1, 'La race d\'abeille est requise'),
    securisee: z.boolean(),
    maladie: z.string().optional(),
});

type RucheFormValues = z.infer<typeof rucheSchema>;

interface EditRucheDialogProps {
    rucheId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditRucheDialog({ rucheId, open, onOpenChange }: EditRucheDialogProps) {
    const [isLoading, setIsLoading] = useState(true);
    const { enums } = useEnums();

    // Récupérer les données de la ruche
    const { data: rucheData, loading: fetchLoading } = useQuery<RucheData>(GET_RUCHE_BY_ID, {
        variables: { id: rucheId },
        skip: !open,
        fetchPolicy: 'network-only', // Pour avoir les données fraîches
    });

    const [updateRuche, { loading: updateLoading }] = useMutation(UPDATE_RUCHE, {
        refetchQueries: [{ query: GET_RUCHES }],
        onCompleted: () => {
            toast.success('Ruche modifiée avec succès !');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Erreur lors de la modification de la ruche', {
                description: error.message,
            });
        },
    });

    const form = useForm<RucheFormValues>({
        resolver: zodResolver(rucheSchema),
        defaultValues: {
            immatriculation: '',
            type: '',
            statut: '',
            race: '',
            securisee: false,
            maladie: 'Aucune',
        },
    });

    // Surveiller le statut pour gérer l'affichage de la maladie
    const currentStatut = form.watch('statut');
    const isMalade = currentStatut === 'Malade';

    // Charger les données de la ruche dans le formulaire
    useEffect(() => {
        if (rucheData?.ruches_by_pk) {
            const ruche = rucheData.ruches_by_pk;
            form.reset({
                immatriculation: ruche.immatriculation,
                type: ruche.type,
                statut: ruche.statut,
                race: ruche.race,
                securisee: ruche.securisee,
                // TODO: Vérifier si le champ maladie existe dans la réponse GraphQL
                // Si non, il faudra peut-être le gérer via les interventions de type "Sanitaire"
                // Pour l'instant, on laisse par défaut ou on récupère s'il existe
                maladie: ruche.maladie || 'Aucune',
            });
            setIsLoading(false);
        }
    }, [rucheData, form]);

    // Réinitialiser le champ maladie si le statut n'est plus "Malade"
    useEffect(() => {
        if (!isMalade) {
            form.setValue('maladie', 'Aucune');
        }
    }, [isMalade, form]);

    const onSubmit = async (values: RucheFormValues) => {
        try {
            const changes: any = {
                immatriculation: values.immatriculation,
                type: values.type,
                statut: values.statut,
                race: values.race,
                securisee: values.securisee,
            };

            // N'envoyer la maladie que si c'est pertinent (selon ton backend)
            // Si tu as un champ maladie dans la table ruches:
            if (values.maladie) {
                changes.maladie = values.maladie;
            }

            await updateRuche({
                variables: {
                    id: rucheId,
                    changes: changes,
                },
            });
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-900">
                        <Hexagon className="h-5 w-5" />
                        Modifier la ruche
                    </DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de la ruche.
                    </DialogDescription>
                </DialogHeader>

                {fetchLoading || isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            {/* Immatriculation */}
                            <FormField
                                control={form.control}
                                name="immatriculation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Immatriculation *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: RU-2024-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {/* Type de ruche */}
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {enums.typeRuche.map((option) => (
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

                                {/* Race d'abeille */}
                                <FormField
                                    control={form.control}
                                    name="race"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Race *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {enums.raceAbeille.map((option) => (
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

                            <div className="grid grid-cols-2 gap-4">
                                {/* Statut */}
                                <FormField
                                    control={form.control}
                                    name="statut"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Statut *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {enums.statut.map((option) => (
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

                                {/* Sécurisée */}
                                <FormField
                                    control={form.control}
                                    name="securisee"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col gap-2">
                                            <FormLabel>Sécurisée (Anti-vol)</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <span className="text-sm text-gray-500">
                                                        {field.value ? 'Oui' : 'Non'}
                                                    </span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Champ Maladie (Conditionnel) */}
                            {isMalade && (
                                <FormField
                                    control={form.control}
                                    name="maladie"
                                    render={({ field }) => (
                                        <FormItem className="bg-red-50 p-4 rounded-md border border-red-100 animate-in fade-in slide-in-from-top-2">
                                            <FormLabel className="text-red-800">Type de maladie *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="border-red-200 focus:ring-red-200">
                                                        <SelectValue placeholder="Sélectionner la maladie..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white">
                                                    {enums.maladie.map((option) => (
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
                            )}

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
                                    {updateLoading ? 'Modification...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
