'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse, LoginData, RegisterData } from './authService';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  entreprises?: Array<{
    id: string;
    nom: string;
    role: string;
    typeOffre?: string;
    typeProfiles?: string[];
    subscriptionActive?: boolean;
    paid?: boolean;
    offre?: {
      id?: string;
      dateDebut?: string;
      dateFin?: string | null;
      active?: boolean;
      nbRuchersMax?: number;
      nbCapteursMax?: number;
      nbReinesMax?: number;
      createdAt?: string;
      updatedAt?: string;
      type?: {
        value?: string;
        titre?: string;
        description?: string;
        prixHT?: string | number | null;
        prixTTC?: string | number | null;
      };
    };
  }>;
  entreprise_id?: string;
  entreprise_nom?: string;
  entreprise_role?: string;
  entreprise_typeOffre?: string;
  entreprise_nbRuchersMax?: number;
  entreprise_nbReinesMax?: number;
  entreprise_typeProfiles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  switchEntreprise: (entrepriseId: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      authService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      await authService.login(data);
      const userData = await authService.getMe();
      setUser(userData);

      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const authData = await authService.register(data);
      setUser(authData.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const switchEntreprise = async (entrepriseId: string) => {
    try {
      const data = await authService.switchEntreprise(entrepriseId);

      // Refresh user data with new token
      const userData = await authService.getMe(data.access_token);
      setUser(userData);

      // Reload the page to refresh all GraphQL queries with new entreprise context
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du changement d\'entreprise:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchEntreprise,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
