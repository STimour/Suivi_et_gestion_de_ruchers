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
import { CREATE_REINE } from '@/lib/graphql/mutations/reine.mutations';
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
  // Optionnel : créer/associer une reine
  addReine: z.boolean().optional(),
  anneeNaissance: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  codeCouleur: z.string().max(50).optional(),
  lignee: z.string().max(50).optional(),
  noteDouceur: z.number().int().min(0).max(10).optional(),
  commentaire: z.string().max(1000).optional(),
  nonReproductible: z.boolean().optional(),
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

  const [createReine] = useMutation(CREATE_REINE);

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
      addReine: false,
      anneeNaissance: new Date().getFullYear(),
      codeCouleur: '',
      lignee: '',
      noteDouceur: 5,
      commentaire: '',
      nonReproductible: false,
    },
  });

  const onSubmit = async (values: RucheFormValues) => {
    try {
      let reineId: string | undefined = undefined;

      if (values.addReine) {
        // Create reine first
        const reineInput = {
          id: crypto.randomUUID(),
          anneeNaissance: values.anneeNaissance,
          codeCouleur: values.codeCouleur || null,
          lignee: values.lignee || null,
          noteDouceur: values.noteDouceur ?? 0,
          commentaire: values.commentaire || null,
          nonReproductible: values.nonReproductible || false,
        };

        const res = await createReine({ variables: { reine: reineInput } });
        reineId = (res as any)?.data?.insert_reines_one?.id;
      }

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
            ...(reineId ? { reine_id: reineId } : {}),
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
            {/* Option d'ajout/association d'une reine */}
            <FormField
              control={form.control}
              name="addReine"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ajouter / associer une reine</FormLabel>
                    <FormDescription>
                      Créer ou associer une reine à cette ruche lors de sa création.
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

            {form.watch('addReine') && (
              <div className="space-y-3 rounded-lg border p-4 bg-amber-50">
                <p className="text-sm font-medium text-amber-900">Fiche Reine</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="anneeNaissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année de naissance</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lignée</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="noteDouceur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note douceur (0-10)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="commentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commentaire</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full rounded-md border p-2"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nonReproductible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Non reproductible</FormLabel>
                        <FormDescription>
                          La reine est-elle non reproductible ?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
