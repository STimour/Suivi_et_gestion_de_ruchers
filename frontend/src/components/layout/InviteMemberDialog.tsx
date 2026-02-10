'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/AuthContext';
import { authService } from '@/lib/auth/authService';
import { Loader2, UserPlus } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !role) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!user?.entreprise_id) {
      toast.error('Aucune entreprise associée à votre compte');
      return;
    }

    setLoading(true);
    try {
      await authService.sendInvitation(email, role, user.entreprise_id);
      toast.success('Invitation envoyée !', {
        description: `Un email a été envoyé à ${email}`,
      });
      setEmail('');
      setRole('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi', {
        description: err.message || 'Veuillez réessayer',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <UserPlus className="h-5 w-5" />
            Inviter un membre
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour rejoindre votre entreprise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-amber-900">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="membre@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-amber-200 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role" className="text-amber-900">Rôle *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="border-amber-200 focus:border-amber-500 focus:ring-amber-500">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Apiculteur">Apiculteur</SelectItem>
                <SelectItem value="Lecteur">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer l\'invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
