import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEvent } from '@/api/events.api'
import { CreateEventForm, Event } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'
import { router } from 'expo-router'
import { qk } from '@/lib/queryKeys'

interface UpdateEventVariables {
  eventId: string
  form: CreateEventForm
}

export const useUpdateEvent = () => {
  const { user, loading: authLoading, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<Event, Error, UpdateEventVariables>({
    mutationFn: async ({ eventId, form }) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in to edit an event')
      }
      return await updateEvent(eventId, form, user.id)
    },
    onSuccess: (_, { eventId }) => {
      // Previously only the lists were invalidated, so the detail screen you
      // had just edited kept showing the old event.
      queryClient.invalidateQueries({ queryKey: qk.events.all })
      queryClient.invalidateQueries({ queryKey: qk.events.detail(eventId) })
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending || authLoading,
    updateEvent: (eventId: string, form: CreateEventForm, callbacks?: { onSuccess?: () => void; onError?: (err: Error) => void }) =>
      mutation.mutate({ eventId, form }, { onSuccess: callbacks?.onSuccess, onError: callbacks?.onError }),
  }
}
