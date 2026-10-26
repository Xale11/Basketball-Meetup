import { QueryClient } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'

/**
 * Everything a court-booking change can affect: the session itself, every
 * calendar week, and the normal event caches (a court place is mirrored into
 * event_participants, so attendee counts and "I'm going" change too).
 */
export const invalidateCourtBooking = (queryClient: QueryClient, eventId: string | null, userId?: string | null) => {
  if (eventId) {
    queryClient.invalidateQueries({ queryKey: qk.courtBooking.session(eventId) })
    queryClient.invalidateQueries({ queryKey: qk.events.detail(eventId) })
    queryClient.invalidateQueries({ queryKey: qk.friends.forEvent(eventId, userId) })
  }
  queryClient.invalidateQueries({ queryKey: ['courtBooking', 'calendar'] })
  queryClient.invalidateQueries({ queryKey: qk.courtBooking.index })
  queryClient.invalidateQueries({ queryKey: qk.events.lists })
  if (userId) {
    queryClient.invalidateQueries({ queryKey: qk.events.participations(userId) })
    queryClient.invalidateQueries({ queryKey: qk.events.participating(userId) })
    queryClient.invalidateQueries({ queryKey: qk.notifications.all })
  }
}
