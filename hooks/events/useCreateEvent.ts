import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent } from '@/api/events.api'
import { CreateEventForm, Event } from '@/types/event'
import { useAuth } from '@/hooks/useAuth'
import { router } from 'expo-router'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['myEvents', user?.id] })
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending || authLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    createEvent: mutation.mutate,
    createEventAsync: mutation.mutateAsync,
    isAuthenticated: !!user,
    user,
  }
}
