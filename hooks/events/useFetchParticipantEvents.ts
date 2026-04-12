import { useQuery } from '@tanstack/react-query'
import { fetchParticipantEvents } from '@/api/events.api'
import { Event } from '@/types/event'

export const useFetchParticipantEvents = (userId: string | undefined | null) => {
  const query = useQuery<Event[], Error>({
    queryKey: ['participantEvents', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => fetchParticipantEvents(userId!),
  })

  return {
    ...query,
    loading: !!userId && (query.isPending || query.isFetching),
    events: query.data ?? [],
  }
}
