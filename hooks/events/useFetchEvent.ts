import { useQuery } from '@tanstack/react-query'
import { fetchEventById } from '@/api/events.api'
import { Event } from '@/types/event'
import { qk } from '@/lib/queryKeys'

export const useFetchEvent = (eventId: string | undefined | null) => {
  const query = useQuery<{ event: Event; participantCount: number }, Error>({
    queryKey: qk.events.detail(eventId),
    enabled: !!eventId,
    queryFn: () => fetchEventById(eventId!),
  })

  return {
    ...query,
    loading: !!eventId && query.isPending,
    fetching: query.isFetching,
    event: query.data?.event ?? null,
    participantCount: query.data?.participantCount ?? 0,
  }
}
