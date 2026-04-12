import { useQuery } from '@tanstack/react-query'
import { fetchEventsByUserId } from '@/api/events.api'
import { Event } from '@/types/event'

export const useFetchMyEvents = (userId: string | undefined | null) => {
  const query = useQuery<Event[], Error>({
    queryKey: ['myEvents', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => fetchEventsByUserId(userId!),
  })

  return {
    ...query,
    loading: !!userId && (query.isPending || query.isFetching),
    error: query.error,
    isSuccess: query.isSuccess,
    isError: query.isError,
    events: query.data ?? [],
    refetchMyEvents: query.refetch,
  }
}
