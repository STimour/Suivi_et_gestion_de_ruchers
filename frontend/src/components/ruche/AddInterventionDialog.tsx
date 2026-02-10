'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { CREATE_INTERVENTION } from '@/lib/graphql/mutations/intervention.mutations';
import { GET_RUCHE_BY_ID } from '@/lib/graphql/queries/ruche.queries';
import { useEnums } from '@/hooks/useEnums';
import { ClipboardList, Plus } from 'lucide-react';

// Schéma de validation dynamique
const interventionSchema = z.object({
    type: z.string().min(1, 'Le type est requis'),
    date: z.string().min(1, 'La date et l\'heure sont requises'),
    observations: z.string().optional(),
    produit: z.string().optional(),
    dosage: z.string().optional(),
    nbHausses: z.number().optional(),
    poidsKg: z.number().optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface AddInterventionDialogProps {
    rucheId: string;
    rucheImmatriculation?: string;
    trigger?: React.ReactNode;
}

export function AddInterventionDialog({
    rucheId,
    rucheImmatriculation,
    trigger
}: AddInterventionDialogProps) {
    const [open, setOpen] = useState(false);
    const { enums } = useEnums();

    const [createIntervention, { loading }] = useMutation(CREATE_INTERVENTION, {
        refetchQueries: [{ query: GET_RUCHE_BY_ID, variables: { id: rucheId } }],
        onCompleted: () => {
            toast.success('Intervention enregistrée avec succès !');
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast.error('Erreur lors de l\'enregistrement', {
                description: error.message,
            });
        },
    });

    const form = useForm<InterventionFormValues>({
        resolver: zodResolver(interventionSchema),
        defaultValues: {
            type: '',
            date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
            observations: '',
            produit: '',
            dosage: '',
            nbHausses: undefined,
            poidsKg: undefined,
        },
    });

    // Surveiller le type d'intervention pour afficher les champs appropriés
    const typeIntervention = form.watch('type');

    // Déterminer quels champs afficher selon le type
    const showProduitDosage = ['Nourrissement', 'Traitement'].includes(typeIntervention);
    const showPoidsKg = typeIntervention === 'Recolte';
    const showNbHausses = typeIntervention === 'PoseHausse';

    const onSubmit = async (values: InterventionFormValues) => {
        try {
            const interventionData: any = {
                id: crypto.randomUUID(),
                type: values.type,
                date: values.date,
                observations: values.observations || '',
                ruche_id: rucheId,
            };

            // Ajouter les champs spécifiques selon le type
            if (showProduitDosage) {
                interventionData.produit = values.produit || '';
                interventionData.dosage = values.dosage || '';
            }
            if (showPoidsKg && values.poidsKg) {
                interventionData.poidsKg = values.poidsKg;
            }
            if (showNbHausses && values.nbHausses) {
                interventionData.nbHausses = values.nbHausses;
            }

            await createIntervention({
                variables: {
                    intervention: interventionData,
                },
            });
        } catch (error) {
            console.error('Erreur lors de la création:', error);
        }
    };

    // Obtenir l'icône et la couleur selon le type
    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'Visite':
                return 'bg-blue-50 border-blue-200';
            case 'Nourrissement':
                return 'bg-amber-50 border-amber-200';
            case 'Traitement':
                return 'bg-red-50 border-red-200';
            case 'Recolte':
                return 'bg-green-50 border-green-200';
            case 'Division':
                return 'bg-purple-50 border-purple-200';
            case 'PoseHausse':
                return 'bg-indigo-50 border-indigo-200';
            case 'ControleSanitaire':
                return 'bg-orange-50 border-orange-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        Nouvelle intervention
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-900">
                        <ClipboardList className="h-5 w-5" />
                        Nouvelle intervention
                    </DialogTitle>
                    <DialogDescription>
                        {rucheImmatriculation && (
                            <span className="font-medium text-green-700">
                                Ruche {rucheImmatriculation}
                            </span>
                        )}
                        {' - '}Enregistrez une intervention sur cette ruche.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Type et Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type d'intervention *</FormLabel>
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
                                                {enums.typeIntervention.map((option) => (
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

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date et heure *</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Champs spécifiques selon le type */}
                        {typeIntervention && (
                            <div className={`rounded-lg border p-4 space-y-4 ${getTypeStyle(typeIntervention)}`}>
                                {/* Produit et Dosage (Nourrissement, Traitement) */}
                                {showProduitDosage && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="produit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Produit</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Nom du produit"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dosage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dosage</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: 500ml"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Poids récolté (Recolte) */}
                                {showPoidsKg && (
                                    <FormField
                                        control={form.control}
                                        name="poidsKg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Poids récolté (kg)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Ex: 15.5"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* Nombre de hausses (PoseHausse) */}
                                {showNbHausses && (
                                    <FormField
                                        control={form.control}
                                        name="nbHausses"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre de hausses</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Ex: 2"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Nombre de hausses posées
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {/* Observations */}
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observations</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notes et remarques sur l'intervention..."
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
