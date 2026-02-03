'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronDown } from 'lucide-react';

export function EntrepriseSwitcher() {
  const { user, switchEntreprise } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!user || !user.entreprises || user.entreprises.length <= 1) {
    // Ne rien afficher si l'utilisateur n'a qu'une seule entreprise
    return null;
  }

  const handleSwitch = async (entrepriseId: string) => {
    if (entrepriseId === user.entreprise_id || isSwitching) return;

    setIsSwitching(true);
    try {
      await switchEntreprise(entrepriseId);
    } catch (error) {
      console.error('Erreur lors du changement d\'entreprise:', error);
      setIsSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-9 px-3 text-amber-700 hover:text-amber-900 hover:bg-amber-50"
          disabled={isSwitching}
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden md:inline text-sm font-medium truncate max-w-[150px]">
            {user.entreprise_nom || 'Sélectionner'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-white">
        <DropdownMenuLabel className="text-xs text-amber-700/70">
          Changer d'entreprise
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.entreprises.map((entreprise) => (
          <DropdownMenuItem
            key={entreprise.id}
            className="cursor-pointer"
            onClick={() => handleSwitch(entreprise.id)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-amber-900">
                  {entreprise.nom}
                </span>
                <span className="text-xs text-amber-700/60">
                  {entreprise.role}
                </span>
              </div>
              {entreprise.id === user.entreprise_id && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
