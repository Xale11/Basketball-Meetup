import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  closeCourtRegistrationNow,
  expireCourtHoldNow,
  simulateCourtPlayers,
} from '@/api/AC_courtBooking.api'
import { useAuth } from '@/hooks/useAuth'
import { invalidateCourtBooking } from './AC_invalidateCourtBooking'

/**
 * Organiser-only demo controls for a court session. They fast-forward the real
 * flow — demo players pay with a Stripe test card, and the hold / registration
 * deadlines are moved to now — so the whole lifecycle fits in a meeting.
 */
export const AC_useDemoControls = (eventId: string) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const onSettled = () => invalidateCourtBooking(queryClient, eventId, user?.id)

  const simulate = useMutation<{ joined: string[] }, Error, number>({
    mutationFn: (count) => simulateCourtPlayers(eventId, count),
    onSettled,
  })
  const expireHold = useMutation<unknown, Error, void>({
    mutationFn: () => expireCourtHoldNow(eventId),
    onSettled,
  })
  const closeRegistration = useMutation<unknown, Error, void>({
    mutationFn: () => closeCourtRegistrationNow(eventId),
    onSettled,
  })

  return {
    simulatePlayers: simulate.mutate,
    expireHoldNow: expireHold.mutate,
    closeRegistrationNow: closeRegistration.mutate,
    loading: simulate.isPending || expireHold.isPending || closeRegistration.isPending,
    error: simulate.error ?? expireHold.error ?? closeRegistration.error,
  }
}
