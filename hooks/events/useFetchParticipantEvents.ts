import { useQuery } from '@tanstack/react-query'
import { fetchParticipantEvents } from '@/api/events.api'
import { Event } from '@/types/event'
import { qk } from '@/lib/queryKeys'

export const useFetchParticipantEvents = (userId: string | undefined | null) => {
  const query = useQuery<Event[], Error>({
    queryKey: qk.events.participating(userId),
    enabled: !!userId,
    queryFn: () => fetchParticipantEvents(userId!),
  })

  return {
    ...query,
    loading: !!userId && query.isPending,
    fetching: query.isFetching,
    events: query.data ?? [],
  }
}
