import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth/AuthContext';
import { GET_RUCHERS } from '@/lib/graphql/queries/rucher.queries';
import { GET_REINES } from '@/lib/graphql/queries/reine.queries';

export function useQuota() {
  const { user } = useAuth();

  const maxRuchers = user?.entreprise_nbRuchersMax;
  const maxReines = user?.entreprise_nbReinesMax;

  // -1 or undefined means unlimited
  const hasRucherLimit = maxRuchers !== undefined && maxRuchers !== null && maxRuchers >= 0;
  const hasReineLimit = maxReines !== undefined && maxReines !== null && maxReines >= 0;
  const isFreemium = user?.entreprise_typeOffre !== 'Premium';

  const { data: ruchersData } = useQuery<any>(GET_RUCHERS, {
    skip: !hasRucherLimit,
  });
  const { data: reinesData } = useQuery<any>(GET_REINES, {
    skip: !hasReineLimit,
  });

  const totalRuchers = ruchersData?.ruchers?.length ?? 0;
  const totalReines = reinesData?.reines?.length ?? 0;

  return {
    canCreateRucher: !hasRucherLimit || totalRuchers < maxRuchers!,
    canCreateReine: !hasReineLimit || totalReines < maxReines!,
    isFreemium,
  };
}
