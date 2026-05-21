import { useQuery } from '@tanstack/react-query'
import { fetchUserParticipations } from '@/api/events.api'
import { EventParticipant, EventParticipantStatus } from '@/types/event'

export const useUserParticipations = (userId?: string | null) => {
  const query = useQuery<EventParticipant[], Error>({
    queryKey: ['userParticipations', userId],
    queryFn: () => fetchUserParticipations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const participationMap = new Map<string, EventParticipantStatus>(
    (query.data ?? []).map((p) => [p.event_id, p.status]),
  )

  return {
    ...query,
    loading: query.isPending,
    participations: query.data ?? [],
    participationMap,
  }
}
