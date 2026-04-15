import { useQuery } from '@tanstack/react-query'
import { fetchUserParticipatingEventIds } from '@/api/events.api'

export const useUserParticipatingEvents = (userId: string | undefined) => {
  const query = useQuery({
    queryKey: ['participatingEventIds', userId],
    enabled: !!userId,
    queryFn: () => fetchUserParticipatingEventIds(userId!),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const joinedEventIds = new Set(query.data ?? [])

  return {
    joinedEventIds,
    isJoined: (eventId: string) => joinedEventIds.has(eventId),
  }
}
