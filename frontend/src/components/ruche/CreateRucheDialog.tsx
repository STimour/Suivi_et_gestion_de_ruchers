'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { CREATE_RUCHE } from '@/lib/graphql/mutations/ruche.mutations';
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { useEnums } from '@/hooks/useEnums';
import { Hexagon, Plus } from 'lucide-react';

// Schéma de validation
const rucheSchema = z.object({
  immatriculation: z.string().min(1, 'L\'immatriculation est requise').max(50, 'L\'immatriculation est trop longue'),
  type: z.string().min(1, 'Le type est requis').max(100, 'Le type est trop long'),
  race: z.string().min(1, 'La race est requise').max(100, 'La race est trop longue'),
  statut: z.string().min(1, 'Le statut est requis'),
  maladie: z.string().max(50, 'Le nom de la maladie est trop long'),
  securisee: z.boolean(),
  rucherId: z.string().uuid('Sélectionnez un rucher'),
});

type RucheFormValues = z.infer<typeof rucheSchema>;

interface CreateRucheDialogProps {
  trigger?: React.ReactNode;
  defaultRucherId?: string;
}

export function CreateRucheDialog({ trigger, defaultRucherId }: CreateRucheDialogProps) {
  const [open, setOpen] = useState(false);

  // Récupérer les enums pour les selects
  const { enums } = useEnums();

  // Récupérer la liste des ruchers pour le select
  const { data: ruchersData } = useQuery<any>(GET_RUCHERS);

  const [createRuche, { loading }] = useMutation(CREATE_RUCHE, {
    refetchQueries: [{ query: GET_RUCHES }],
    onCompleted: () => {
      toast.success('Ruche créée avec succès !');
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la ruche', {
        description: error.message,
      });
    },
  });

  const form = useForm<RucheFormValues>({
    resolver: zodResolver(rucheSchema),
    defaultValues: {
      immatriculation: '',
      type: '',
      race: '',
      statut: 'Active',
      maladie: 'Aucune',
      securisee: false,
      rucherId: defaultRucherId || '',
    },
  });

  const onSubmit = async (values: RucheFormValues) => {
    try {
      await createRuche({
        variables: {
          ruche: {
            id: crypto.randomUUID(),
            immatriculation: values.immatriculation,
            type: values.type,
            race: values.race,
            statut: values.statut,
            maladie: values.maladie || 'Aucune',
            securisee: values.securisee,
            rucher_id: values.rucherId,
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
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle ruche
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Hexagon className="h-5 w-5" />
            Créer une nouvelle ruche
          </DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle ruche à votre exploitation. Remplissez tous les
            champs requis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="immatriculation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immatriculation *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: R-2024-001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Numéro unique d'identification de la ruche
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
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

              <FormField
                control={form.control}
                name="race"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race *</FormLabel>
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

              <FormField
                control={form.control}
                name="rucherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rucher *</FormLabel>
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
                        {ruchersData?.ruchers?.map((rucher: any) => (
                          <SelectItem key={rucher.id} value={rucher.id}>
                            {rucher.nom}
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
              name="securisee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ruche sécurisée</FormLabel>
                    <FormDescription>
                      Cette ruche dispose-t-elle d'un système de sécurité anti-vol ?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {loading ? 'Création...' : 'Créer la ruche'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
