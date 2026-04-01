import { useQuery } from '@tanstack/react-query'
import { getSocietyMembershipsByUserId, SocietyMembershipWithSociety } from '@/api/societies.api'

export const useFetchUserSocieties = (userId: string | undefined | null) => {
  const query = useQuery<SocietyMembershipWithSociety[], Error>({
    queryKey: ['userSocieties', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: () => getSocietyMembershipsByUserId(userId!),
  })

  return {
    ...query,
    loading: !!userId && (query.isPending || query.isFetching),
    memberships: query.data ?? [],
  }
}
