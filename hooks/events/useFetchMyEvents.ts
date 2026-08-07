import { useQuery } from '@tanstack/react-query'
import { fetchEventsByUserId } from '@/api/events.api'
import { Event } from '@/types/event'
import { qk } from '@/lib/queryKeys'

export const useFetchMyEvents = (userId: string | undefined | null) => {
  const query = useQuery<Event[], Error>({
    queryKey: qk.events.mine(userId),
    enabled: !!userId,
    queryFn: () => fetchEventsByUserId(userId!),
  })

  return {
    ...query,
    loading: !!userId && query.isPending,
    fetching: query.isFetching,
    events: query.data ?? [],
    refetchMyEvents: query.refetch,
  }
}
