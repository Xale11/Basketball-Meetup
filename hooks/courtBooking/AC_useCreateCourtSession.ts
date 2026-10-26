import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { createCourtSession } from '@/api/AC_courtBooking.api'
import { CreateCourtSessionForm } from '@/types/AC_courtBooking'
import { useAuth } from '@/hooks/useAuth'
import { invalidateCourtBooking } from './AC_invalidateCourtBooking'

/** Reserves a court and creates its event. Errors carry a player-facing message (e.g. the slot is taken). */
export const AC_useCreateCourtSession = () => {
  const { user, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<{ eventId: string }, Error, CreateCourtSessionForm>({
    mutationFn: async (form) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in to book a court')
      }
      return createCourtSession(form)
    },
    onSuccess: ({ eventId }) => invalidateCourtBooking(queryClient, eventId, user?.id),
  })

  return {
    ...mutation,
    loading: mutation.isPending,
    createCourtSession: mutation.mutate,
    createCourtSessionAsync: mutation.mutateAsync,
  }
}
