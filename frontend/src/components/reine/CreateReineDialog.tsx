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
import { CREATE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { GET_REINES } from '@/lib/graphql/queries/reine.queries';
import { GET_RUCHES } from '@/lib/graphql/queries/ruche.queries';
import { Crown, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfileMode } from '@/lib/context/ProfileModeContext';
import { GET_REINES_ELEVAGE } from '@/lib/graphql/queries/reine.queries';

// Options de couleur (cycle international 5 ans)
const COLOR_OPTIONS = [
  { value: 'Blanc', label: 'Blanc (années en 1 ou 6)' },
  { value: 'Jaune', label: 'Jaune (années en 2 ou 7)' },
  { value: 'Rouge', label: 'Rouge (années en 3 ou 8)' },
  { value: 'Vert', label: 'Vert (années en 4 ou 9)' },
  { value: 'Bleu', label: 'Bleu (années en 5 ou 0)' },
];

// Statuts possibles (valeurs DB)
const STATUT_OPTIONS = [
  { value: 'Fecondee', label: 'Fécondée' },
  { value: 'NonFecondee', label: 'Non fécondée' },
  { value: 'DisponibleVente', label: 'Disponible à la vente' },
  { value: 'Vendu', label: 'Vendue' },
  { value: 'Perdue', label: 'Perdue' },
  { value: 'Eliminee', label: 'Éliminée' },
];

// Lignées valides (FK vers lignee_reine)
const LIGNEE_OPTIONS = [
  { value: 'Buckfast', label: 'Buckfast' },
  { value: 'Carnica', label: 'Carnica' },
  { value: 'Ligustica', label: 'Ligustica' },
  { value: 'Caucasica', label: 'Caucasica' },
  { value: 'Locale', label: 'Locale' },
  { value: 'Inconnue', label: 'Inconnue' },
];

// Schéma de validation
const createReineSchema = (isEleveur: boolean) => z.object({
  anneeNaissance: z.number({ message: 'L\'année est requise' })
    .int('L\'année doit être un entier')
    .min(2000, 'Minimum 2000')
    .max(new Date().getFullYear(), 'Année invalide'),
  codeCouleur: z.string().min(1, 'La couleur est requise'),
  lignee: z.string().min(1, 'La lignée est requise').max(100, 'La lignée est trop longue'),
  rucheId: isEleveur
    ? z.string().optional()
    : z.string().uuid('Sélectionnez une ruche'),
  statut: z.string().min(1, 'Le statut est requis'),
  noteDouceur: z.number({ message: 'La note est requise' })
    .int('La note doit être un entier')
    .min(1, 'Minimum 1')
    .max(10, 'Maximum 10'),
  commentaire: z.string().max(500, 'Les notes sont trop longues').optional(),
});

type ReineFormValues = z.infer<ReturnType<typeof createReineSchema>>;

interface CreateReineDialogProps {
  trigger?: React.ReactNode;
  defaultRucheId?: string;
}

export function CreateReineDialog({ trigger, defaultRucheId }: CreateReineDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isEleveur } = useProfileMode();

  // Récupérer la liste des ruches pour le select
  const { data: ruchesData } = useQuery<any>(GET_RUCHES);

  const refetchQueries: any[] = [{ query: GET_REINES }];
  if (isEleveur) {
    refetchQueries.push({ query: GET_REINES_ELEVAGE });
  }

  const [createReine, { loading }] = useMutation(CREATE_REINE, {
    refetchQueries,
    onCompleted: () => {
      toast.success('Reine créée avec succès !');
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la reine', {
        description: error.message,
      });
    },
  });

  const form = useForm<ReineFormValues>({
    resolver: zodResolver(createReineSchema(isEleveur)),
    defaultValues: {
      anneeNaissance: new Date().getFullYear(),
      codeCouleur: '',
      lignee: '',
      rucheId: defaultRucheId || '',
      noteDouceur: 5,
      statut: 'Fecondee',
      commentaire: '',
    },
  });

  const onSubmit = async (values: ReineFormValues) => {
    try {
      await createReine({
        variables: {
          reine: {
            id: crypto.randomUUID(),
            anneeNaissance: values.anneeNaissance,
            codeCouleur: values.codeCouleur,
            lignee: values.lignee,
            ruche_id: values.rucheId || null,
            noteDouceur: values.noteDouceur,
            statut: values.statut,
            commentaire: values.commentaire || '',
            nonReproductible: false,
            isElevage: isEleveur,
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
            Nouvelle reine
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Crown className="h-5 w-5" />
            Créer une nouvelle reine
          </DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle reine à votre exploitation. Remplissez tous les
            champs requis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anneeNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année de naissance *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
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
                name="codeCouleur"
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
              name="lignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lignée *</FormLabel>
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
                      {LIGNEE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Origine génétique de la reine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rucheId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruche associée {isEleveur ? '(optionnel)' : '*'}</FormLabel>
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
                        {ruchesData?.ruches?.filter((ruche: any) => !ruche.reine).map((ruche: any) => (
                          <SelectItem key={ruche.id} value={ruche.id}>
                            {ruche.immatriculation} {ruche.rucher?.nom ? `(${ruche.rucher.nom})` : ''}
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
            </div>

            <FormField
              control={form.control}
              name="noteDouceur"
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
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations, remarques..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section Future Features - Disabled placeholders */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Fonctionnalités à venir</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                  <p className="text-sm font-medium text-gray-400">Cycle</p>
                  <p className="text-xs text-gray-300">Indisponible</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                  <p className="text-sm font-medium text-gray-400">Généalogie</p>
                  <p className="text-xs text-gray-300">Indisponible</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-50">
                  <p className="text-sm font-medium text-gray-400">Historique</p>
                  <p className="text-xs text-gray-300">Indisponible</p>
                </div>
              </div>
            </div>

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
                {loading ? 'Création...' : 'Créer la reine'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
