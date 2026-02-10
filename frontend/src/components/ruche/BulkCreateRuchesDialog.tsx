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
import {
  STATUT_OPTIONS,
  TYPE_RUCHE_OPTIONS,
  RACE_ABEILLE_OPTIONS,
  MALADIE_OPTIONS
} from '@/lib/constants/ruche.constants';
import { Hexagon, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Schéma de validation
const bulkRucheSchema = z.object({
  type: z.string().min(1, 'Le type est requis').max(100, 'Le type est trop long'),
  race: z.string().min(1, 'La race est requise').max(100, 'La race est trop longue'),
  statut: z.string().min(1, 'Le statut est requis'),
  maladie: z.string().max(50, 'Le nom de la maladie est trop long'),
  securisee: z.boolean(),
  rucherId: z.string().uuid('Sélectionnez un rucher'),
  prefixe: z.string().length(1, 'Le préfixe doit être une seule lettre').regex(/^[A-Za-z]$/, 'Le préfixe doit être une lettre'),
  nombreRuches: z.number({ message: 'Le nombre doit être un nombre' })
    .int('Le nombre doit être un nombre entier')
    .min(1, 'Minimum 1 ruche')
    .max(100, 'Maximum 100 ruches à la fois'),
  numeroDebut: z.number({ message: 'Le numéro de départ doit être un nombre' })
    .int('Le numéro de départ doit être un nombre entier')
    .min(1, 'Minimum 1'),
});

type BulkRucheFormValues = z.infer<typeof bulkRucheSchema>;

interface BulkCreateRuchesDialogProps {
  trigger?: React.ReactNode;
  defaultRucherId?: string;
}

export function BulkCreateRuchesDialog({ trigger, defaultRucherId }: BulkCreateRuchesDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Récupérer la liste des ruchers pour le select
  const { data: ruchersData } = useQuery<any>(GET_RUCHERS);

  const [createRuche] = useMutation(CREATE_RUCHE, {
    refetchQueries: [{ query: GET_RUCHES }],
  });

  const form = useForm<BulkRucheFormValues>({
    resolver: zodResolver(bulkRucheSchema),
    defaultValues: {
      type: '',
      race: '',
      statut: 'Active',
      maladie: 'Aucune',
      securisee: false,
      rucherId: defaultRucherId || '',
      prefixe: 'R',
      nombreRuches: 10,
      numeroDebut: 1,
    },
  });

  const onSubmit = async (values: BulkRucheFormValues) => {
    setIsCreating(true);
    setProgress(0);

    try {
      const promises = [];
      const total = values.nombreRuches;

      for (let i = 0; i < total; i++) {
        const numeroRuche = values.numeroDebut + i;
        const immatriculation = `${values.prefixe.toUpperCase()}${String(numeroRuche).padStart(7, '0')}`;

        const promise = createRuche({
          variables: {
            ruche: {
              id: crypto.randomUUID(),
              immatriculation: immatriculation,
              type: values.type,
              race: values.race,
              statut: values.statut,
              maladie: values.maladie || 'Aucune',
              securisee: values.securisee,
              rucher_id: values.rucherId,
            },
          },
        }).then(() => {
          setProgress(((i + 1) / total) * 100);
        });

        promises.push(promise);
      }

      await Promise.all(promises);

      toast.success(`${total} ruches créées avec succès !`, {
        description: `De ${values.prefixe.toUpperCase()}${String(values.numeroDebut).padStart(7, '0')} à ${values.prefixe.toUpperCase()}${String(values.numeroDebut + total - 1).padStart(7, '0')}`,
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error('Erreur lors de la création des ruches', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
      setProgress(0);
    }
  };

  // Aperçu des immatriculations
  const prefixe = form.watch('prefixe');
  const nombreRuches = form.watch('nombreRuches');
  const numeroDebut = form.watch('numeroDebut');

  const apercu = nombreRuches > 0 && prefixe && numeroDebut
    ? `${prefixe.toUpperCase()}${String(numeroDebut).padStart(7, '0')} à ${prefixe.toUpperCase()}${String(numeroDebut + nombreRuches - 1).padStart(7, '0')}`
    : 'Ex: R0000001 à R0000010';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Upload className="h-4 w-4" />
            Import en masse
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Hexagon className="h-5 w-5" />
            Créer plusieurs ruches en masse
          </DialogTitle>
          <DialogDescription>
            Créez plusieurs ruches identiques en une seule fois. Les immatriculations seront générées automatiquement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre de ruches et préfixe */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="prefixe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lettre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R"
                        maxLength={1}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroDebut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° début *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
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
                name="nombreRuches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Aperçu */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-700 mb-1">Aperçu des immatriculations :</p>
              <p className="text-sm font-medium text-amber-900">{apercu}</p>
            </div>

            {/* Type et Race */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {TYPE_RUCHE_OPTIONS.map((option) => (
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {RACE_ABEILLE_OPTIONS.map((option) => (
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

            {/* Statut et Rucher */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              <FormField
                control={form.control}
                name="rucherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rucher *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

            {/* Sécurisée */}
            <FormField
              control={form.control}
              name="securisee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ruches sécurisées</FormLabel>
                    <FormDescription>
                      Ces ruches disposent-elles d'un système de sécurité anti-vol ?
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

            {/* Barre de progression */}
            {isCreating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">Création en cours...</span>
                  <span className="font-medium text-amber-900">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isCreating}
              >
                {isCreating ? 'Création...' : `Créer ${nombreRuches || 0} ruches`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
