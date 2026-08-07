import { useQuery } from '@tanstack/react-query'
import { getUniversityMembershipByUserId } from '@/api/universities.api'
import { UniversityMembership } from '@/types/universities'
import { qk } from '@/lib/queryKeys'

export const useFetchUniversityMembership = (userId: string | undefined | null) => {
  const query = useQuery<UniversityMembership | null, Error>({
    queryKey: qk.universities.membership(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    queryFn: () => getUniversityMembershipByUserId(userId!),
  })

  return {
    ...query,
    loading: !!userId && query.isPending,
    fetching: query.isFetching,
    membership: query.data ?? null,
  }
}
