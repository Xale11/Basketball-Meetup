import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent } from '@/api/events.api'
import { CreateEventForm, Event } from '@/types/event'
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
      return await createEvent(form, user.id)
    },
    onSuccess: (event) => {
      // Invalidating the `events` root covers every list, detail, mine and
      // bySociety query in one go.
      queryClient.invalidateQueries({ queryKey: qk.events.all })
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
