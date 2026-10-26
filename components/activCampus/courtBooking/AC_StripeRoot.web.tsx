import { type ReactNode } from 'react'

/** Web stand-in for AC_StripeRoot.tsx: the Stripe React Native SDK has no web build. */
export function AC_StripeRoot({ children }: { children: ReactNode }) {
  return <>{children}</>
}
