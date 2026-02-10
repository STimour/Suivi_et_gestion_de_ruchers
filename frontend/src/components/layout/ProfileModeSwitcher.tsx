'use client';

import { useProfileMode, ProfileMode } from '@/lib/context/ProfileModeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Hexagon, Crown } from 'lucide-react';

const PROFILE_CONFIG: Record<ProfileMode, { label: string; icon: typeof Hexagon; dashboardPath: string }> = {
  ApiculteurProducteur: { label: 'Gestion de Ruchers', icon: Hexagon, dashboardPath: '/dashboard' },
  EleveurDeReines: { label: 'Elevage de Reines', icon: Crown, dashboardPath: '/dashboard/elevage' },
};

export function ProfileModeSwitcher() {
  const { profileMode, setProfileMode, availableProfiles, hasMultipleProfiles } = useProfileMode();
  const router = useRouter();

  if (!hasMultipleProfiles) return null;

  const current = PROFILE_CONFIG[profileMode];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-9 px-3 text-amber-700 hover:text-amber-900 hover:bg-amber-50"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline text-sm font-medium truncate max-w-[160px]">
            {current.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-white">
        <DropdownMenuLabel className="text-xs text-amber-700/70">
          Changer de profil
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableProfiles.map((profile) => {
          const config = PROFILE_CONFIG[profile];
          const ProfileIcon = config.icon;
          return (
            <DropdownMenuItem
              key={profile}
              className="cursor-pointer"
              onClick={() => {
                if (profile === profileMode) return;
                setProfileMode(profile);
                router.push(PROFILE_CONFIG[profile].dashboardPath);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ProfileIcon className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    {config.label}
                  </span>
                </div>
                {profile === profileMode && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
