import React, { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/api/supabase"
import { User } from "@/types/user"
import { Session } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { useFetchById } from "@/hooks/users/useFetchUserById"

type AuthContextValue = {
  session: Session | null
  /**
   * True only until we know whether a session exists (cold start).
   * This is the ONLY flag the root layout may gate navigation on — it never
   * flips back to true afterwards, so refetches can't tear down the app.
   */
  initialising: boolean
  /** `initialising` plus any in-flight sign-in/sign-up/sign-out. For button and screen spinners. */
  loading: boolean
  user: User | null
  /** True once the profile query has settled, or immediately when signed out. */
  profileLoaded: boolean
  /** Signed in, profile fetched, and no `profiles` row exists yet. */
  needsOnboarding: boolean
  signUpWithEmail: (email: string, password: string, name: string) => Promise<Session | null>
  signInWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuth: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  initialising: true,
  loading: true,
  user: null,
  profileLoaded: false,
  needsOnboarding: false,
  signUpWithEmail: async () => null,
  signInWithEmail: async () => {},
  logout: async () => {},
  isAuth: async () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const userId = session?.user?.id
  const { data: profile, isFetched: profileFetched } = useFetchById(userId)

  useEffect(() => {
    let mounted = true

    // 1) Resolve the persisted session once on cold start. This is the single
    //    place `initialising` is cleared, so there is no race between callbacks.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) console.error("[AuthProvider] getSession failed:", error.message)
        setSession(data.session ?? null)
      })
      .catch((error) => {
        if (!mounted) return
        console.error("[AuthProvider] getSession threw:", error)
      })
      .finally(() => {
        if (mounted) setInitialising(false)
      })

    // 2) Track sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return

      // This callback MUST stay synchronous. The auth client holds a lock while
      // it runs, so calling back into supabase.auth.* from here can deadlock and
      // hang the app on the splash screen. Defer any async work.
      setSession(nextSession ?? null)
      setInitialising(false)

      // Only an explicit sign-out clears cached data. Note that this fires for
      // INITIAL_SESSION (with a null session, before storage rehydrates) and for
      // TOKEN_REFRESHED too — treating any falsy session as a sign-out is what
      // used to bounce people to the login screen at random.
      if (event === "SIGNED_OUT") {
        queueMicrotask(() => queryClient.clear())
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [queryClient])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error("[AuthProvider] sign in failed:", error.message)
        throw new Error(error.message)
      }
      // Navigation is handled by the route guard in app/_layout.tsx once the
      // session lands — do not push routes from here.
    } finally {
      setSubmitting(false)
    }
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, _name: string): Promise<Session | null> => {
      setSubmitting(true)
      try {
        const {
          data: { session: nextSession },
          error,
        } = await supabase.auth.signUp({ email, password })

        if (error) {
          console.error("[AuthProvider] sign up failed:", error.message)
          throw new Error(error.message)
        }

        // Null session means email confirmation is pending — the caller routes
        // to the "check your inbox" screen.
        return nextSession
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[AuthProvider] sign out failed:", error.message)
        throw new Error(error.message)
      }
      // The SIGNED_OUT listener clears state and the cache.
    } finally {
      setSubmitting(false)
    }
  }, [])

  /**
   * Whether a session currently exists.
   *
   * The previous implementation returned `!!data`, which is always a truthy
   * object even when signed out — so every caller's auth guard was a no-op.
   */
  const isAuth = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("[AuthProvider] isAuth getSession failed:", error.message)
      return false
    }
    return !!data.session
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initialising,
      loading: initialising || submitting,
      user: profile ?? null,
      profileLoaded: !userId || profileFetched,
      needsOnboarding: !!userId && profileFetched && profile === null,
      signUpWithEmail,
      signInWithEmail,
      logout,
      isAuth,
    }),
    [
      session,
      initialising,
      submitting,
      profile,
      profileFetched,
      userId,
      signUpWithEmail,
      signInWithEmail,
      logout,
      isAuth,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
