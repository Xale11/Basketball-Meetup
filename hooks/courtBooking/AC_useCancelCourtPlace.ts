import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { cancelCourtPlace } from '@/api/AC_courtBooking.api'
import { CancelCourtPlaceResult } from '@/types/AC_courtBooking'
import { useAuth } from '@/hooks/useAuth'
import { invalidateCourtBooking } from './AC_invalidateCourtBooking'

/**
 * Gives up a court place. Call only after the player has confirmed in the
 * cancellation dialog: there is no undo. `VOID` = the hold was released,
 * `LIABLE` = place released but they still pay unless someone takes it.
 */
export const AC_useCancelCourtPlace = () => {
  const { user, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<CancelCourtPlaceResult, Error, { eventId: string }>({
    mutationFn: async ({ eventId }) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in')
      }
      return cancelCourtPlace(eventId)
    },
    onSettled: (_, __, { eventId }) => invalidateCourtBooking(queryClient, eventId, user?.id),
  })

  return {
    ...mutation,
    loading: mutation.isPending,
    cancelCourtPlace: mutation.mutate,
  }
}
