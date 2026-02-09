import { useAuth } from '@/lib/auth/AuthContext';

export function useCanEdit(): boolean {
  const { user } = useAuth();
  return user?.entreprise_role !== 'Lecteur';
}
