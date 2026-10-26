import { initPaymentSheet, presentPaymentSheet, PaymentSheetError } from '@stripe/stripe-react-native'

/**
 * Opens Stripe's PaymentSheet for a court-booking commitment (iOS/Android).
 * The web build uses AC_paymentSheet.web.ts instead, because the Stripe React
 * Native SDK has no web implementation.
 *
 * Resolves 'completed' when the card was held or charged, 'canceled' when the
 * player closed the sheet. Throws on a real failure.
 */
export type PaymentSheetOutcome = 'completed' | 'canceled'

export const paymentsSupported = true

export async function payWithPaymentSheet(paymentIntentClientSecret: string): Promise<PaymentSheetOutcome> {
  const init = await initPaymentSheet({
    merchantDisplayName: 'ActivCampus',
    paymentIntentClientSecret,
    // Where the bank sends the player back after a 3D Secure check.
    returnURL: 'activcampus://stripe-redirect',
    defaultBillingDetails: { address: { country: 'GB' } },
  })
  if (init.error) throw new Error(init.error.message)

  const { error } = await presentPaymentSheet()
  if (!error) return 'completed'
  if (error.code === PaymentSheetError.Canceled) return 'canceled'
  throw new Error(error.message)
}
