import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { joinCourtSession } from '@/api/AC_courtBooking.api'
import { payWithPaymentSheet } from '@/lib/AC_paymentSheet'
import { useAuth } from '@/hooks/useAuth'
import { invalidateCourtBooking } from './AC_invalidateCourtBooking'

/**
 * - `paid`: the card was held (court Reserved) or charged (court Confirmed).
 *   The server records it from Stripe's webhook a moment later.
 * - `rejoined`: got a previous place back; their original commitment still
 *   stands, so nothing was charged.
 * - `processing`: an earlier payment for this place is still being confirmed.
 * - `canceled`: the player closed the payment sheet. Their place is released
 *   automatically if they don't come back to pay.
 */
export type JoinCourtOutcome = 'paid' | 'rejoined' | 'processing' | 'canceled'

/** Join or rejoin a court session: reserve a place, then pay in Stripe's PaymentSheet. */
export const AC_useJoinCourtSession = () => {
  const { user, isAuth } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation<JoinCourtOutcome, Error, { eventId: string }>({
    mutationFn: async ({ eventId }) => {
      const isAuthenticated = await isAuth()
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth/login')
        throw new Error('You must be logged in to join')
      }

      const result = await joinCourtSession(eventId)
      if (!result.needsPayment) return result.processing ? 'processing' : 'rejoined'

      const outcome = await payWithPaymentSheet(result.paymentIntentClientSecret)
      return outcome === 'completed' ? 'paid' : 'canceled'
    },
    onSettled: (_, __, { eventId }) => {
      invalidateCourtBooking(queryClient, eventId, user?.id)
      // The webhook usually lands within a second or two of the sheet closing.
      setTimeout(() => invalidateCourtBooking(queryClient, eventId, user?.id), 2500)
    },
  })

  return {
    ...mutation,
    loading: mutation.isPending,
    joinCourtSession: mutation.mutate,
    joinCourtSessionAsync: mutation.mutateAsync,
  }
}
