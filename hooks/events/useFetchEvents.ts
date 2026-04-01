import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/events.api'
import { Event } from '@/types/event'

export const useFetchEvents = () => {
  const query = useQuery<Event[], Error>({
    queryKey: ['events'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: fetchEvents,
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
