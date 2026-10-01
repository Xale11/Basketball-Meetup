import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent, joinEvent } from '@/api/events.api'
import { CreateEventForm, Event, EventJoinPolicy } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'
import { router } from 'expo-router'
import { qk } from '@/lib/queryKeys'

export const useCreateEvent = () => {
  const { user, loading: authLoading, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<Event, Error, CreateEventForm>({
    mutationFn: async (form: CreateEventForm) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in to create an event')
      }
      const event = await createEvent(form, user.id)

      // Add the host to their own activity unless they opted out.
      //
      // `EventJoinPolicy.OPEN` is passed deliberately rather than the event's
      // own policy: on an approval-required activity the host would otherwise
      // land in their own approval queue as REQUESTED.
      if (form.auto_join !== false) {
        try {
          await joinEvent(event.id, user.id, EventJoinPolicy.OPEN)
        } catch (err) {
          // A failed self-join must not fail the creation — the activity is
          // published and valid; the host can join from the detail screen.
          console.error('[useCreateEvent] host auto-join failed:', err)
        }
      }

      return event
    },
    onSuccess: (event) => {
      // Invalidating the `events` root covers every list, detail, mine and
      // bySociety query in one go.
      queryClient.invalidateQueries({ queryKey: qk.events.all })
      // The host is now a participant, so their own participation map is stale.
      queryClient.invalidateQueries({ queryKey: qk.events.participations(user?.id) })
      if (event?.society_id) {
        queryClient.invalidateQueries({ queryKey: qk.events.bySociety(event.society_id) })
      }
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending || authLoading,
    createEvent: mutation.mutate,
    createEventAsync: mutation.mutateAsync,
    isAuthenticated: !!user,
    user,
  }
}
