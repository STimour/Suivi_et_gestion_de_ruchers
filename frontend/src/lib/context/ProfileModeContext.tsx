'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export type ProfileMode = 'ApiculteurProducteur' | 'EleveurDeReines';

interface ProfileModeContextType {
  profileMode: ProfileMode;
  setProfileMode: (mode: ProfileMode) => void;
  availableProfiles: ProfileMode[];
  isEleveur: boolean;
  hasMultipleProfiles: boolean;
}

const ProfileModeContext = createContext<ProfileModeContextType | undefined>(undefined);

const STORAGE_KEY = 'profile_mode';
const DEFAULT_MODE: ProfileMode = 'ApiculteurProducteur';

export function ProfileModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const availableProfiles = useMemo<ProfileMode[]>(() => {
    const profiles: ProfileMode[] = ['ApiculteurProducteur'];
    if (user?.entreprise_typeProfiles?.includes('EleveurDeReines')) {
      profiles.push('EleveurDeReines');
    }
    return profiles;
  }, [user?.entreprise_typeProfiles]);

  const [profileMode, setProfileModeState] = useState<ProfileMode>(DEFAULT_MODE);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY) as ProfileMode | null;
    if (stored && availableProfiles.includes(stored)) {
      setProfileModeState(stored);
    } else {
      setProfileModeState(DEFAULT_MODE);
    }
  }, [availableProfiles]);

  const setProfileMode = (mode: ProfileMode) => {
    if (!availableProfiles.includes(mode)) return;
    setProfileModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  return (
    <ProfileModeContext.Provider
      value={{
        profileMode,
        setProfileMode,
        availableProfiles,
        isEleveur: profileMode === 'EleveurDeReines',
        hasMultipleProfiles: availableProfiles.length > 1,
      }}
    >
      {children}
    </ProfileModeContext.Provider>
  );
}

export function useProfileMode() {
  const context = useContext(ProfileModeContext);
  if (context === undefined) {
    throw new Error('useProfileMode doit être utilisé dans un ProfileModeProvider');
  }
  return context;
}
