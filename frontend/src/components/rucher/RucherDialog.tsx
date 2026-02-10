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
import { CREATE_RUCHER } from '@/lib/graphql/mutations/rucher.mutations';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { useEnums } from '@/hooks/useEnums';
import { MapPin, Plus } from 'lucide-react';
import { LocationPickerWrapper } from './LocationPickerWrapper';
import { useAuth } from '@/lib/auth/AuthContext';

// Schéma de validation
const rucherSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  latitude: z.number({ message: 'Sélectionnez un emplacement sur la carte' })
    .refine((val) => val !== 0, 'Sélectionnez un emplacement sur la carte')
    .refine((val) => val >= -90 && val <= 90, 'Latitude invalide'),
  longitude: z.number({ message: 'Sélectionnez un emplacement sur la carte' })
    .refine((val) => val !== 0, 'Sélectionnez un emplacement sur la carte')
    .refine((val) => val >= -180 && val <= 180, 'Longitude invalide'),
  flore: z.string().min(1, 'Le type de flore est requis'),
  altitude: z.number({ message: 'L\'altitude doit être un nombre' })
    .int('L\'altitude doit être un nombre entier')
    .min(-500, 'Altitude trop basse')
    .max(9000, 'Altitude trop élevée'),
  notes: z.string().optional(),
});

type RucherFormValues = z.infer<typeof rucherSchema>;

interface CreateRucherDialogProps {
  trigger?: React.ReactNode;
}

export function CreateRucherDialog({ trigger }: CreateRucherDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { enums } = useEnums();

  const [createRucher, { loading }] = useMutation(CREATE_RUCHER, {
    refetchQueries: [{ query: GET_RUCHERS }],
    onCompleted: () => {
      toast.success('Rucher créé avec succès !');
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du rucher', {
        description: error.message,
      });
    },
  });

  const form = useForm<RucherFormValues>({
    resolver: zodResolver(rucherSchema),
    defaultValues: {
      nom: '',
      latitude: 0,
      longitude: 0,
      flore: '',
      altitude: 0,
      notes: '',
    },
  });

  const onSubmit = async (values: RucherFormValues) => {
    try {
      await createRucher({
        variables: {
          rucher: {
            id: crypto.randomUUID(),
            nom: values.nom,
            latitude: values.latitude,
            longitude: values.longitude,
            flore: values.flore,
            altitude: values.altitude,
            notes: values.notes || '',
            entreprise_id: user?.entreprise_id || null,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Nouveau rucher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <MapPin className="h-5 w-5" />
            Créer un nouveau rucher
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouvel emplacement pour vos ruches. Remplissez tous les
            champs requis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du rucher *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rucher de la forêt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sélecteur de localisation avec carte */}
            <div className="space-y-2">
              <FormLabel>Localisation *</FormLabel>
              <LocationPickerWrapper
                latitude={form.watch('latitude')}
                longitude={form.watch('longitude')}
                onLocationChange={(lat, lng) => {
                  form.setValue('latitude', lat, { shouldValidate: true });
                  form.setValue('longitude', lng, { shouldValidate: true });
                }}
              />
              {(form.formState.errors.latitude || form.formState.errors.longitude) && (
                <p className="text-sm text-destructive">
                  Veuillez sélectionner un emplacement sur la carte
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de flore *</FormLabel>
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
                        {enums.flore.map((option) => (
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
                name="altitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altitude (m) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 250"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informations complémentaires..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ajoutez des notes optionnelles sur cet emplacement
                  </FormDescription>
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
                className="bg-amber-600 hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le rucher'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
