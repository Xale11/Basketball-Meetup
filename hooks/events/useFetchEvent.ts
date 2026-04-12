import { useQuery } from '@tanstack/react-query'
import { fetchEventById } from '@/api/events.api'
import { Event } from '@/types/event'

export const useFetchEvent = (eventId: string | undefined | null) => {
  const query = useQuery<{ event: Event; participantCount: number }, Error>({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => fetchEventById(eventId!),
  })

  return {
    ...query,
    loading: !!eventId && (query.isPending || query.isFetching),
    event: query.data?.event ?? null,
    participantCount: query.data?.participantCount ?? 0,
  }
}
