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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREATE_RACLE, CREATE_REINES_BATCH } from '@/lib/graphql/mutations/reine.mutations';
import { GET_RACLES_ELEVAGE, GET_TACHES_ELEVAGE_OVERVIEW } from '@/lib/graphql/queries/reine.queries';
import { Grip, Plus, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

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

function getDefaultColor(year: number): string {
  const lastDigit = year % 10;
  const map: Record<number, string> = {
    1: 'Blanc', 6: 'Blanc',
    2: 'Jaune', 7: 'Jaune',
    3: 'Rouge', 8: 'Rouge',
    4: 'Vert', 9: 'Vert',
    5: 'Bleu', 0: 'Bleu',
  };
  return map[lastDigit] || 'Blanc';
}

const createRacleSchema = z.object({
  reference: z.string().min(1, 'La référence est requise').max(100, 'Référence trop longue'),
  dateCreation: z.string().min(1, 'La date est requise'),
  nbCupules: z.number({ message: 'Le nombre de cupules est requis' })
    .int('Doit être un entier')
    .min(1, 'Minimum 1'),
  commentaire: z.string().max(500, 'Commentaire trop long').optional(),
  autoCreateReines: z.boolean(),
  reineLignee: z.string().optional(),
  reineCouleur: z.string().optional(),
}).refine(
  (data) => !data.autoCreateReines || (data.reineLignee && data.reineLignee.length > 0),
  { message: 'La lignée est requise', path: ['reineLignee'] }
).refine(
  (data) => !data.autoCreateReines || (data.reineCouleur && data.reineCouleur.length > 0),
  { message: 'La couleur est requise', path: ['reineCouleur'] }
);

type RacleFormValues = z.infer<typeof createRacleSchema>;

export function CreateRacleDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const [createRacle, { loading: creatingRacle }] = useMutation(CREATE_RACLE, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }],
    onError: (error) => {
      toast.error('Erreur lors de la création du racle', {
        description: error.message,
      });
    },
  });

  const [createReinesBatch, { loading: creatingReines }] = useMutation(CREATE_REINES_BATCH, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }, { query: GET_TACHES_ELEVAGE_OVERVIEW }],
    onError: (error) => {
      toast.error('Erreur lors de la création des reines', {
        description: error.message,
      });
    },
  });

  const loading = creatingRacle || creatingReines;

  const currentYear = new Date().getFullYear();

  const form = useForm<RacleFormValues>({
    resolver: zodResolver(createRacleSchema),
    defaultValues: {
      reference: '',
      dateCreation: new Date().toISOString().split('T')[0],
      nbCupules: 20,
      commentaire: '',
      autoCreateReines: false,
      reineLignee: '',
      reineCouleur: getDefaultColor(currentYear),
    },
  });

  const autoCreate = form.watch('autoCreateReines');
  const nbCupules = form.watch('nbCupules');

  const onSubmit = async (values: RacleFormValues) => {
    try {
      const racleId = crypto.randomUUID();

      await createRacle({
        variables: {
          racle: {
            id: racleId,
            reference: values.reference,
            dateCreation: values.dateCreation,
            nbCupules: values.nbCupules,
            commentaire: values.commentaire || '',
            entreprise_id: user?.entreprise_id || null,
          },
        },
      });

      if (values.autoCreateReines && values.nbCupules > 0) {
        const reines = Array.from({ length: values.nbCupules }, () => ({
          id: crypto.randomUUID(),
          anneeNaissance: currentYear,
          codeCouleur: values.reineCouleur,
          lignee: values.reineLignee,
          statut: 'NonFecondee',
          noteDouceur: 5,
          commentaire: '',
          nonReproductible: false,
          isElevage: true,
          racle_id: racleId,
          entreprise_id: user?.entreprise_id || null,
        }));

        await createReinesBatch({ variables: { reines } });

        toast.success(`Racle créé avec ${values.nbCupules} reines`);
      } else {
        toast.success('Racle créé avec succès !');
      }

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nouveau racle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Grip className="h-5 w-5" />
            Créer un nouveau racle
          </DialogTitle>
          <DialogDescription>
            Ajoutez un racle pour démarrer un cycle d&apos;élevage de reines.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Racle-2026-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateCreation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de création *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nbCupules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de cupules *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="20"
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
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire</FormLabel>
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

            {/* Switch auto-création reines */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
              <FormField
                control={form.control}
                name="autoCreateReines"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                        <Crown className="h-4 w-4 text-amber-600" />
                        Pré-remplir avec {nbCupules || 0} reines
                      </FormLabel>
                      <p className="text-xs text-gray-500">
                        Crée automatiquement une reine par cupule
                      </p>
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

              {autoCreate && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <FormField
                    control={form.control}
                    name="reineCouleur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Couleur *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {COLOR_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name="reineLignee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Lignée *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {LIGNEE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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
                {loading ? 'Création...' : autoCreate ? `Créer avec ${nbCupules || 0} reines` : 'Créer le racle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
