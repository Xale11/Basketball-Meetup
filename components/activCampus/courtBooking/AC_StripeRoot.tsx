import { type ReactElement, type ReactNode } from 'react'
import { StripeProvider } from '@stripe/stripe-react-native'

/**
 * Makes the Stripe SDK available to court-booking payments (iOS/Android).
 * AC_StripeRoot.web.tsx is the web stand-in.
 *
 * Without a publishable key the app still runs; only paying is unavailable.
 */
const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

export function AC_StripeRoot({ children }: { children: ReactNode }) {
  if (!publishableKey) return <>{children}</>
  return (
    // urlScheme matches the app scheme, so 3D Secure redirects come back here.
    <StripeProvider publishableKey={publishableKey} urlScheme="activcampus">
      {children as ReactElement}
    </StripeProvider>
  )
}
