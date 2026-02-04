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
import { CREATE_TRANSHUMANCE, UPDATE_RUCHER_LOCATION } from '@/lib/graphql/mutations/transhumance.mutations';
import { GET_RUCHER_DETAILS } from '@/lib/graphql/queries/rucher.queries';
import { useEnums } from '@/hooks/useEnums';
import { Truck, MapPin } from 'lucide-react';
import { LocationPickerWrapper } from './LocationPickerWrapper';

// Schéma de validation
const transhumanceSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  destinationLat: z.number().min(-90).max(90).refine((val) => val !== 0, 'Sélectionnez une destination sur la carte'),
  destinationLng: z.number().min(-180).max(180).refine((val) => val !== 0, 'Sélectionnez une destination sur la carte'),
  floreCible: z.string().min(1, 'La flore cible est requise').max(100, 'La flore est trop longue'),
});

type TranshumanceFormValues = z.infer<typeof transhumanceSchema>;

interface TranshumanceDialogProps {
  trigger?: React.ReactNode;
  rucherId: string;
  rucherNom: string;
  currentLat: number;
  currentLng: number;
  currentFlore: string;
}

export function TranshumanceDialog({
  trigger,
  rucherId,
  rucherNom,
  currentLat,
  currentLng,
  currentFlore,
}: TranshumanceDialogProps) {
  const [open, setOpen] = useState(false);
  const { enums } = useEnums();

  const [createTranshumance] = useMutation(CREATE_TRANSHUMANCE);
  const [updateRucherLocation, { loading }] = useMutation(UPDATE_RUCHER_LOCATION, {
    refetchQueries: [
      { query: GET_RUCHER_DETAILS, variables: { id: rucherId } },
    ],
  });

  const form = useForm<TranshumanceFormValues>({
    resolver: zodResolver(transhumanceSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      destinationLat: 0,
      destinationLng: 0,
      floreCible: currentFlore,
    },
  });

  const onSubmit = async (values: TranshumanceFormValues) => {
    try {
      // 1. Créer l'enregistrement de transhumance
      await createTranshumance({
        variables: {
          transhumance: {
            id: crypto.randomUUID(),
            date: values.date,
            origineLat: currentLat,
            origineLng: currentLng,
            destinationLat: values.destinationLat,
            destinationLng: values.destinationLng,
            floreCible: values.floreCible,
            rucher_id: rucherId,
          },
        },
      });

      // 2. Mettre à jour la position du rucher
      await updateRucherLocation({
        variables: {
          id: rucherId,
          latitude: values.destinationLat,
          longitude: values.destinationLng,
          flore: values.floreCible,
        },
      });

      toast.success('Transhumance effectuée avec succès !', {
        description: `Le rucher "${rucherNom}" a été déplacé vers sa nouvelle position.`,
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error('Erreur lors de la transhumance', {
        description: error.message,
      });
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    form.setValue('destinationLat', lat);
    form.setValue('destinationLng', lng);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Truck className="h-4 w-4" />
            Transhumance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Truck className="h-5 w-5" />
            Transhumance du rucher "{rucherNom}"
          </DialogTitle>
          <DialogDescription>
            Déplacez votre rucher vers un nouvel emplacement. L'historique de déplacement sera conservé.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Localisation actuelle */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">Position actuelle</p>
              </div>
              <p className="text-sm text-amber-700">
                {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
              </p>
              <p className="text-xs text-amber-600 mt-1">Flore: {currentFlore}</p>
            </div>

            {/* Date et Flore */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de transhumance *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floreCible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flore cible *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            {/* Nouvelle destination */}
            <div className="space-y-3">
              <div>
                <FormLabel>Nouvelle destination *</FormLabel>
                <FormDescription className="mt-1">
                  Recherchez une adresse ou cliquez sur la carte pour définir la nouvelle position
                </FormDescription>
              </div>
              <FormField
                control={form.control}
                name="destinationLat"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="h-[350px] overflow-hidden">
                        <LocationPickerWrapper
                          latitude={form.watch('destinationLat') || currentLat}
                          longitude={form.watch('destinationLng') || currentLng}
                          onLocationChange={handleLocationChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Aperçu coordonnées destination */}
            {form.watch('destinationLat') !== 0 && form.watch('destinationLng') !== 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-xs text-green-700 mb-1">Nouvelle position :</p>
                <p className="text-sm font-medium text-green-900">
                  {form.watch('destinationLat').toFixed(6)}, {form.watch('destinationLng').toFixed(6)}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {loading ? 'Déplacement...' : 'Effectuer la transhumance'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
