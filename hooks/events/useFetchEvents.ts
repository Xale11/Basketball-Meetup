import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events.api'
import { Event } from '@/types/event'
import { qk } from '@/lib/queryKeys'

export const useFetchEvents = (universityId?: string | null, societyIds?: string[]) => {
  const query = useQuery<Event[], Error>({
    queryKey: qk.events.list(universityId, societyIds),
    queryFn: () => fetchEvents(universityId, societyIds),
  })

  return {
    ...query,
    // `loading` = no data yet. A background refetch must not blank the list.
    loading: query.isPending,
    fetching: query.isFetching,
    error: query.error,
    isSuccess: query.isSuccess,
    isError: query.isError,
    events: query.data ?? [],
    refetchEvents: query.refetch,
  }
}
