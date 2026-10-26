/**
 * Web stand-in for AC_paymentSheet.ts. The Stripe React Native SDK has no web
 * implementation, so court-booking payments are mobile-only for now.
 */
export type PaymentSheetOutcome = 'completed' | 'canceled'

export const paymentsSupported = false

export async function payWithPaymentSheet(_paymentIntentClientSecret: string): Promise<PaymentSheetOutcome> {
  throw new Error('Payments are only available in the ActivCampus mobile app.')
}
