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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREATE_REINE } from '@/lib/graphql/mutations/reine.mutations';
import { GET_RACLES_ELEVAGE, GET_TACHES_ELEVAGE_OVERVIEW } from '@/lib/graphql/queries/reine.queries';
import { Crown, Plus } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'Blanc', label: 'Blanc (années en 1 ou 6)' },
  { value: 'Jaune', label: 'Jaune (années en 2 ou 7)' },
  { value: 'Rouge', label: 'Rouge (années en 3 ou 8)' },
  { value: 'Vert', label: 'Vert (années en 4 ou 9)' },
  { value: 'Bleu', label: 'Bleu (années en 5 ou 0)' },
];

const STATUT_OPTIONS = [
  { value: 'Fecondee', label: 'Fécondée' },
  { value: 'NonFecondee', label: 'Non fécondée' },
  { value: 'DisponibleVente', label: 'Disponible à la vente' },
  { value: 'Vendu', label: 'Vendue' },
  { value: 'Perdue', label: 'Perdue' },
  { value: 'Eliminee', label: 'Éliminée' },
];

const LIGNEE_OPTIONS = [
  { value: 'Buckfast', label: 'Buckfast' },
  { value: 'Carnica', label: 'Carnica' },
  { value: 'Ligustica', label: 'Ligustica' },
  { value: 'Caucasica', label: 'Caucasica' },
  { value: 'Locale', label: 'Locale' },
  { value: 'Inconnue', label: 'Inconnue' },
];

const addReineSchema = z.object({
  anneeNaissance: z.number({ message: "L'année est requise" })
    .int("L'année doit être un entier")
    .min(2000, 'Minimum 2000')
    .max(new Date().getFullYear(), 'Année invalide'),
  codeCouleur: z.string().min(1, 'La couleur est requise'),
  lignee: z.string().min(1, 'La lignée est requise').max(100, 'La lignée est trop longue'),
  statut: z.string().min(1, 'Le statut est requis'),
  noteDouceur: z.number({ message: 'La note est requise' })
    .int('La note doit être un entier')
    .min(1, 'Minimum 1')
    .max(10, 'Maximum 10'),
  commentaire: z.string().max(500, 'Notes trop longues').optional(),
});

type AddReineFormValues = z.infer<typeof addReineSchema>;

interface AddReineToRacleDialogProps {
  racleId: string;
  racleReference: string;
  entrepriseId: string;
  currentCount: number;
  maxCupules: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddReineToRacleDialog({
  racleId,
  racleReference,
  entrepriseId,
  currentCount,
  maxCupules,
  onSuccess,
  trigger,
}: AddReineToRacleDialogProps) {
  const remaining = maxCupules - currentCount;
  const [open, setOpen] = useState(false);

  const [createReine, { loading }] = useMutation(CREATE_REINE, {
    refetchQueries: [{ query: GET_RACLES_ELEVAGE }, { query: GET_TACHES_ELEVAGE_OVERVIEW }],
    onCompleted: () => {
      toast.success('Reine ajoutée au racle !');
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la reine', {
        description: error.message,
      });
    },
  });

  const form = useForm<AddReineFormValues>({
    resolver: zodResolver(addReineSchema),
    defaultValues: {
      anneeNaissance: new Date().getFullYear(),
      codeCouleur: '',
      lignee: '',
      statut: 'NonFecondee',
      noteDouceur: 5,
      commentaire: '',
    },
  });

  const onSubmit = async (values: AddReineFormValues) => {
    try {
      await createReine({
        variables: {
          reine: {
            id: crypto.randomUUID(),
            anneeNaissance: values.anneeNaissance,
            codeCouleur: values.codeCouleur,
            lignee: values.lignee,
            statut: values.statut,
            noteDouceur: values.noteDouceur,
            commentaire: values.commentaire || '',
            nonReproductible: false,
            isElevage: true,
            racle_id: racleId,
            entreprise_id: entrepriseId,
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
          <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Ajouter une reine
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Crown className="h-5 w-5" />
            Ajouter une reine au racle
          </DialogTitle>
          <DialogDescription>
            Racle : <span className="font-medium">{racleReference}</span>
            <span className="block mt-1">
              Places disponibles : <span className="font-medium">{remaining}/{maxCupules}</span>
            </span>
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
                        placeholder="2026"
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

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
                {loading ? 'Ajout...' : 'Ajouter la reine'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
