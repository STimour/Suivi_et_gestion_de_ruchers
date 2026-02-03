'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
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
import { UPDATE_RUCHER } from '@/lib/graphql/mutations/rucher.mutations';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { MapPin, Loader2 } from 'lucide-react';
import { LocationPickerWrapper } from './LocationPickerWrapper';

// Types de flore disponibles
const FLORE_OPTIONS = [
  { value: 'Acacia', label: 'Acacia' },
  { value: 'Colza', label: 'Colza' },
  { value: 'Lavande', label: 'Lavande' },
  { value: 'Tournesol', label: 'Tournesol' },
  { value: 'Chataignier', label: 'Châtaignier' },
  { value: 'Bruyere', label: 'Bruyère' },
  { value: 'Montagne', label: 'Montagne' },
  { value: 'ToutesFleurs', label: 'Toutes fleurs' },
];

// Interface pour typer les données du rucher
interface RucherData {
  ruchers_by_pk: {
    id: string;
    nom: string;
    latitude: number;
    longitude: number;
    flore: string;
    altitude: number;
    notes: string;
  };
}

// Query pour récupérer les infos du rucher
const GET_RUCHER_BY_ID = gql`
  query GetRucherById($id: uuid!) {
    ruchers_by_pk(id: $id) {
      id
      nom
      latitude
      longitude
      flore
      altitude
      notes
    }
  }
`;

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

interface EditRucherDialogProps {
  rucherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRucherDialog({ rucherId, open, onOpenChange }: EditRucherDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer les données du rucher
  const { data: rucherData, loading: fetchLoading } = useQuery<RucherData>(GET_RUCHER_BY_ID, {
    variables: { id: rucherId },
    skip: !open,
  });

  const [updateRucher, { loading: updateLoading }] = useMutation(UPDATE_RUCHER, {
    refetchQueries: [{ query: GET_RUCHERS }],
    onCompleted: () => {
      toast.success('Rucher modifié avec succès !');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du rucher', {
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

  // Charger les données du rucher dans le formulaire
  useEffect(() => {
    if (rucherData?.ruchers_by_pk) {
      const rucher = rucherData.ruchers_by_pk;
      form.reset({
        nom: rucher.nom,
        latitude: rucher.latitude,
        longitude: rucher.longitude,
        flore: rucher.flore,
        altitude: rucher.altitude,
        notes: rucher.notes || '',
      });
      setIsLoading(false);
    }
  }, [rucherData, form]);

  const onSubmit = async (values: RucherFormValues) => {
    try {
      await updateRucher({
        variables: {
          id: rucherId,
          changes: {
            nom: values.nom,
            latitude: values.latitude,
            longitude: values.longitude,
            flore: values.flore,
            altitude: values.altitude,
            notes: values.notes || '',
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <MapPin className="h-5 w-5" />
            Modifier le rucher
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre rucher.
          </DialogDescription>
        </DialogHeader>

        {fetchLoading || isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : (
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
                          {FLORE_OPTIONS.map((option) => (
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
                  {updateLoading ? 'Modification...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
