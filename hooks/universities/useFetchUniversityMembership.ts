import { useQuery } from '@tanstack/react-query'
import { getUniversityMembershipByUserId } from '@/api/universities.api'
import { UniversityMembership } from '@/types/universities'

export const useFetchUniversityMembership = (userId: string | undefined | null) => {
  const query = useQuery<UniversityMembership | null, Error>({
    queryKey: ['universityMembership', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: () => getUniversityMembershipByUserId(userId!),
  })

  return {
    ...query,
    membership: query.data ?? null,
  }
}
