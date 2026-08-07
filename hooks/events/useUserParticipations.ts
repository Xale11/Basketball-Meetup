import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUserParticipations } from '@/api/events.api'
import { EventParticipant, EventParticipantStatus } from '@/types/event'
import { qk } from '@/lib/queryKeys'

/**
 * The single source of truth for "is the current user in this event, and with
 * what status". A parallel `participatingEventIds` cache used to exist; it was
 * never invalidated alongside this one, so join/leave state disagreed between
 * screens. It has been removed.
 */
export const useUserParticipations = (userId?: string | null) => {
  const query = useQuery<EventParticipant[], Error>({
    queryKey: qk.events.participations(userId),
    queryFn: () => fetchUserParticipations(userId!),
    enabled: !!userId,
  })

  const participations = query.data ?? []

  // Memoised: a fresh Map every render gave consumers a new identity each time
  // and defeated any downstream memoisation.
  const participationMap = useMemo(
    () => new Map<string, EventParticipantStatus>(participations.map((p) => [p.event_id, p.status])),
    [query.data],
  )

  return {
    ...query,
    loading: !!userId && query.isPending,
    fetching: query.isFetching,
    participations,
    participationMap,
  }
}
