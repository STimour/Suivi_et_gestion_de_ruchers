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
import { CREATE_BULK_INTERVENTIONS } from '@/lib/graphql/mutations/intervention.mutations';
import { GET_RUCHES_BY_RUCHER } from '@/lib/graphql/queries/ruche.queries';
import { ClipboardList, Plus, Layers } from 'lucide-react';

// Types d'intervention applicables à un rucher entier
const TYPE_INTERVENTION_RUCHER_OPTIONS = [
    { value: 'Visite', label: 'Visite' },
    { value: 'Nourrissement', label: 'Nourrissement' },
    { value: 'Traitement', label: 'Traitement' },
    { value: 'Recolte', label: 'Récolte' },
    { value: 'ControleSanitaire', label: 'Contrôle Sanitaire' },
];

// Schéma de validation
const bulkInterventionSchema = z.object({
    type: z.string().min(1, 'Le type est requis'),
    date: z.string().min(1, 'La date et l\'heure sont requises'),
    observations: z.string().optional(),
    produit: z.string().optional(),
    dosageTotal: z.number().optional(),
    poidsTotalKg: z.number().optional(),
});

type BulkInterventionFormValues = z.infer<typeof bulkInterventionSchema>;

interface BulkInterventionDialogProps {
    rucherId: string;
    rucherNom: string;
    ruches: Array<{ id: string; immatriculation: string }>;
    trigger?: React.ReactNode;
}

export function BulkInterventionDialog({
    rucherId,
    rucherNom,
    ruches,
    trigger
}: BulkInterventionDialogProps) {
    const [open, setOpen] = useState(false);

    const [createBulkInterventions, { loading }] = useMutation(CREATE_BULK_INTERVENTIONS, {
        refetchQueries: [{ query: GET_RUCHES_BY_RUCHER, variables: { rucherId } }],
        onCompleted: () => {
            toast.success(`Intervention enregistrée sur ${ruches.length} ruches !`);
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast.error('Erreur lors de l\'enregistrement', {
                description: error.message,
            });
        },
    });

    const form = useForm<BulkInterventionFormValues>({
        resolver: zodResolver(bulkInterventionSchema),
        defaultValues: {
            type: '',
            date: new Date().toISOString().slice(0, 16),
            observations: '',
            produit: '',
            dosageTotal: undefined,
            poidsTotalKg: undefined,
        },
    });

    const typeIntervention = form.watch('type');
    const dosageTotal = form.watch('dosageTotal');
    const poidsTotalKg = form.watch('poidsTotalKg');

    // Déterminer quels champs afficher
    const showProduitDosage = ['Nourrissement', 'Traitement'].includes(typeIntervention);
    const showPoidsKg = typeIntervention === 'Recolte';

    // Calcul par ruche
    const nbRuches = ruches.length;
    const dosageParRuche = dosageTotal && nbRuches > 0 ? (dosageTotal / nbRuches).toFixed(2) : '-';
    const poidsParRuche = poidsTotalKg && nbRuches > 0 ? (poidsTotalKg / nbRuches).toFixed(2) : '-';

    const onSubmit = async (values: BulkInterventionFormValues) => {
        if (ruches.length === 0) {
            toast.error('Aucune ruche dans ce rucher');
            return;
        }

        try {
            // Créer une intervention pour chaque ruche
            const interventions = ruches.map((ruche) => {
                const interventionData: any = {
                    id: crypto.randomUUID(),
                    type: values.type,
                    date: values.date,
                    observations: values.observations || '',
                    ruche_id: ruche.id,
                };

                // Diviser les valeurs numériques par le nombre de ruches
                if (showProduitDosage) {
                    interventionData.produit = values.produit || '';
                    if (values.dosageTotal) {
                        interventionData.dosage = `${(values.dosageTotal / nbRuches).toFixed(2)}`;
                    }
                }
                if (showPoidsKg && values.poidsTotalKg) {
                    interventionData.poidsKg = values.poidsTotalKg / nbRuches;
                }

                return interventionData;
            });

            await createBulkInterventions({
                variables: {
                    interventions,
                },
            });
        } catch (error) {
            console.error('Erreur lors de la création:', error);
        }
    };

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
                        <Layers className="h-4 w-4" />
                        Intervention groupée
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-900">
                        <ClipboardList className="h-5 w-5" />
                        Intervention groupée
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-green-700">
                            Rucher {rucherNom}
                        </span>
                        {' - '}
                        Cette intervention sera appliquée aux <span className="font-semibold">{nbRuches} ruches</span> de ce rucher.
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
                                                {TYPE_INTERVENTION_RUCHER_OPTIONS.map((option) => (
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
                                {/* Produit et Dosage total (Nourrissement, Traitement) */}
                                {showProduitDosage && (
                                    <>
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
                                            name="dosageTotal"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dosage total (pour {nbRuches} ruches)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Ex: 500"
                                                            {...field}
                                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        Par ruche : <span className="font-semibold">{dosageParRuche}</span> unités
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                {/* Poids total récolté (Recolte) */}
                                {showPoidsKg && (
                                    <FormField
                                        control={form.control}
                                        name="poidsTotalKg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Poids total récolté (kg)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Ex: 150"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    Par ruche : <span className="font-semibold">{poidsParRuche} kg</span>
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}

                        {/* Observations communes */}
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observations communes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ces observations seront appliquées à toutes les ruches..."
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Ces observations seront identiques pour les {nbRuches} ruches
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Résumé */}
                        {nbRuches > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-900 mb-2">
                                    📋 Résumé de l'intervention groupée
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• {nbRuches} intervention(s) seront créées</li>
                                    <li>• Une par ruche du rucher "{rucherNom}"</li>
                                    {showProduitDosage && dosageTotal && (
                                        <li>• Dosage par ruche : {dosageParRuche} unités</li>
                                    )}
                                    {showPoidsKg && poidsTotalKg && (
                                        <li>• Poids par ruche : {poidsParRuche} kg</li>
                                    )}
                                </ul>
                            </div>
                        )}

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
                                disabled={loading || nbRuches === 0}
                            >
                                {loading ? 'Enregistrement...' : `Enregistrer (${nbRuches} ruches)`}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
