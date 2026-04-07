import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events.api'
import { Event } from '@/types/event'

export const useFetchEvents = (universityId?: string | null, societyIds?: string[]) => {
  const query = useQuery<Event[], Error>({
    queryKey: ['events', universityId, societyIds],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => fetchEvents(universityId, societyIds),
  })

  return {
    ...query,
    loading: query.isPending || query.isFetching,
    error: query.error,
    isSuccess: query.isSuccess,
    isError: query.isError,
    events: query.data ?? [],
    refetchEvents: query.refetch,
  }
}
