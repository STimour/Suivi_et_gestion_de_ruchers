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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CREATE_RUCHE, CREATE_RUCHE_WITH_REINE } from '@/lib/graphql/mutations/ruche.mutations';
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { GET_REINES } from '@/lib/graphql/queries/reine.queries';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { useEnums } from '@/hooks/useEnums';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuota } from '@/hooks/useQuota';
import { Hexagon, Plus, Crown } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'Blanc', label: 'Blanc (années en 1 ou 6)' },
  { value: 'Jaune', label: 'Jaune (années en 2 ou 7)' },
  { value: 'Rouge', label: 'Rouge (années en 3 ou 8)' },
  { value: 'Vert', label: 'Vert (années en 4 ou 9)' },
  { value: 'Bleu', label: 'Bleu (années en 5 ou 0)' },
];

const LIGNEE_OPTIONS = [
  { value: 'Buckfast', label: 'Buckfast' },
  { value: 'Carnica', label: 'Carnica' },
  { value: 'Ligustica', label: 'Ligustica' },
  { value: 'Caucasica', label: 'Caucasica' },
  { value: 'Locale', label: 'Locale' },
  { value: 'Inconnue', label: 'Inconnue' },
];

// Schéma de validation
const rucheSchema = z.object({
  immatriculationLettre: z.string().length(1, 'Une seule lettre').regex(/^[A-Za-z]$/, 'Doit être une lettre'),
  immatriculationNumero: z.number({ message: 'Le numéro est requis' })
    .int('Le numéro doit être un entier')
    .min(1, 'Minimum 1')
    .max(9999999, 'Maximum 9999999'),
  type: z.string().min(1, 'Le type est requis').max(100, 'Le type est trop long'),
  race: z.string().min(1, 'La race est requise').max(100, 'La race est trop longue'),
  statut: z.string().min(1, 'Le statut est requis'),
  maladie: z.string().max(50, 'Le nom de la maladie est trop long'),
  securisee: z.boolean(),
  rucherId: z.string().uuid('Sélectionnez un rucher'),
  // Reine optionnelle
  ajouterReine: z.boolean(),
  reineAnneeNaissance: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  reineCodCouleur: z.string().optional(),
  reineLignee: z.string().max(100).optional(),
  reineNoteDouceur: z.number().int().min(1).max(10).optional(),
  reineCommentaire: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.ajouterReine) {
    if (!data.reineAnneeNaissance) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "L'année est requise", path: ['reineAnneeNaissance'] });
    }
    if (!data.reineCodCouleur) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La couleur est requise', path: ['reineCodCouleur'] });
    }
    if (!data.reineLignee) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La lignée est requise', path: ['reineLignee'] });
    }
    if (!data.reineNoteDouceur) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La note est requise', path: ['reineNoteDouceur'] });
    }
  }
});

type RucheFormValues = z.infer<typeof rucheSchema>;

interface CreateRucheDialogProps {
  trigger?: React.ReactNode;
  defaultRucherId?: string;
}

export function CreateRucheDialog({ trigger, defaultRucherId }: CreateRucheDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { canCreateReine, isFreemium } = useQuota();

  // Récupérer les enums pour les selects
  const { enums } = useEnums();

  // Récupérer la liste des ruchers pour le select
  const { data: ruchersData } = useQuery<any>(GET_RUCHERS);

  const [createRuche, { loading: rucheLoading }] = useMutation(CREATE_RUCHE, {
    refetchQueries: [{ query: GET_RUCHES }],
    errorPolicy: 'all',
  });

  const [createRucheWithReine, { loading: withReineLoading }] = useMutation(CREATE_RUCHE_WITH_REINE, {
    refetchQueries: [{ query: GET_RUCHES }, { query: GET_REINES }],
    errorPolicy: 'all',
  });

  const loading = rucheLoading || withReineLoading;

  const form = useForm<RucheFormValues>({
    resolver: zodResolver(rucheSchema),
    defaultValues: {
      immatriculationLettre: 'R',
      immatriculationNumero: 1,
      type: '',
      race: '',
      statut: 'Active',
      maladie: 'Aucune',
      securisee: false,
      rucherId: defaultRucherId || '',
      ajouterReine: false,
      reineAnneeNaissance: new Date().getFullYear(),
      reineCodCouleur: '',
      reineLignee: '',
      reineNoteDouceur: 5,
      reineCommentaire: '',
    },
  });

  const ajouterReine = form.watch('ajouterReine');

  const onSubmit = async (values: RucheFormValues) => {
    try {
      const rucheId = crypto.randomUUID();
      const immatriculation = `${values.immatriculationLettre.toUpperCase()}${String(values.immatriculationNumero).padStart(7, '0')}`;

      const rucheData = {
        id: rucheId,
        immatriculation,
        type: values.type,
        race: values.race,
        statut: values.statut,
        maladie: values.maladie || 'Aucune',
        securisee: values.securisee,
        rucher_id: values.rucherId,
      };

      if (values.ajouterReine) {
        // Mutation combinée : ruche + reine dans une seule transaction
        const result = await createRucheWithReine({
          variables: {
            ruche: rucheData,
            reine: {
              id: crypto.randomUUID(),
              anneeNaissance: values.reineAnneeNaissance,
              codeCouleur: values.reineCodCouleur,
              lignee: values.reineLignee,
              ruche_id: rucheId,
              noteDouceur: values.reineNoteDouceur,
              statut: 'Fecondee',
              commentaire: values.reineCommentaire || '',
              nonReproductible: false,
              isElevage: false,
              entreprise_id: user?.entreprise_id || null,
            },
          },
        });

        if (result.error) {
          throw result.error;
        }
        toast.success('Ruche et reine créées avec succès !');
      } else {
        const result = await createRuche({
          variables: { ruche: rucheData },
        });

        if (result.error) {
          throw result.error;
        }
        toast.success('Ruche créée avec succès !');
      }

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création', {
        description: (error as Error).message,
      });
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
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-2">
              <FormLabel>Immatriculation *</FormLabel>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <FormField
                  control={form.control}
                  name="immatriculationLettre"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="R"
                          maxLength={1}
                          className="text-center font-mono text-lg"
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
                  name="immatriculationNumero"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0000001"
                          className="font-mono"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Format: 1 lettre + 7 chiffres (ex: R0000001)
              </FormDescription>
            </div>

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

            {/* Section Reine optionnelle */}
            <FormField
              control={form.control}
              name="ajouterReine"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      Ajouter une reine
                    </FormLabel>
                    <FormDescription>
                      {!canCreateReine && isFreemium
                        ? 'Limite Freemium atteinte pour les reines'
                        : 'Créer une reine et l\'associer directement à cette ruche'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        if (checked && !canCreateReine) return;
                        field.onChange(checked);
                      }}
                      disabled={!canCreateReine}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {ajouterReine && (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reineAnneeNaissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année de naissance *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2024"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reineCodCouleur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code couleur *</FormLabel>
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
                            {COLOR_OPTIONS.map((option) => (
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

                <FormField
                  control={form.control}
                  name="reineLignee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lignée *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {LIGNEE_OPTIONS.map((option) => (
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
                  name="reineNoteDouceur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note de douceur * (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          placeholder="5"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reineCommentaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observations, remarques..."
                          className="resize-none"
                          rows={2}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
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
                {loading ? 'Création...' : ajouterReine ? 'Créer la ruche et la reine' : 'Créer la ruche'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
