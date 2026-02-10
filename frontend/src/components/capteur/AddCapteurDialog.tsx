'use client';

import { useState } from 'react';
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
import { Plus, Radio } from 'lucide-react';
import { TYPE_CAPTEUR_OPTIONS } from '@/lib/constants/capteur.constants';
import { capteurService } from '@/lib/services/capteurService';

const capteurSchema = z.object({
    type: z.string().min(1, 'Le type est requis'),
    identifiant: z.string().min(1, "L'identifiant est requis"),
    name: z.string().optional(),
});

type CapteurFormValues = z.infer<typeof capteurSchema>;

interface AddCapteurDialogProps {
    rucheId: string;
    rucheImmatriculation?: string;
    onSuccess?: () => void;
}

export function AddCapteurDialog({
    rucheId,
    rucheImmatriculation,
    onSuccess,
}: AddCapteurDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<CapteurFormValues>({
        resolver: zodResolver(capteurSchema),
        defaultValues: {
            type: '',
            identifiant: '',
            name: '',
        },
    });

    const onSubmit = async (values: CapteurFormValues) => {
        setLoading(true);
        try {
            await capteurService.associateCapteur({
                ruche_id: rucheId,
                type: values.type,
                identifiant: values.identifiant,
                name: values.name || undefined,
            });
            toast.success('Capteur ajouté avec succès !');
            setOpen(false);
            form.reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error("Erreur lors de l'ajout du capteur", {
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Ajouter un capteur
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-900">
                        <Radio className="h-5 w-5" />
                        Ajouter un capteur
                    </DialogTitle>
                    <DialogDescription>
                        {rucheImmatriculation && (
                            <span className="font-medium text-blue-700">
                                Ruche {rucheImmatriculation}
                            </span>
                        )}
                        {' - '}Associez un capteur IoT à cette ruche.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type de capteur *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un type..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {TYPE_CAPTEUR_OPTIONS.map((option) => (
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
                            name="identifiant"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Identifiant unique *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: TEMP-001, GPS-RCH42..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom personnalisé</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Sonde température intérieure"
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
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={loading}
                            >
                                {loading ? 'Ajout en cours...' : 'Ajouter'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
