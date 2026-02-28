// auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "@/api/supabase"
import { User } from "@/types/user"
import { JwtPayload, Session } from "@supabase/supabase-js"
import { router, usePathname } from "expo-router"
import { useFetchById } from "@/hooks/users/useFetchUserById"

type AuthContextValue = {
  session: Session | null
  loading: boolean
  user: User | null
  claims: JwtPayload | null
  signUpWithEmail: (email: string, password: string, name: string) => Promise<Session | null>
  signInWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuth: () => Promise<boolean | null>
}

export const AuthContext = createContext<AuthContextValue>({ session: null, loading: true, user: null, claims: null, signUpWithEmail: async () => null, signInWithEmail: async () => {}, logout: async () => {}, isAuth: async () => null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true, set false after auth state known
  const [claims, setClaims] = useState<JwtPayload | null>(null)
  const pathname = usePathname();

  const {} = useFetchById(session?.user.id)

  useEffect(() => {
    let mounted = true

    // 1) Load initial session (cold start / app reopen)
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
        })

    //@ts-ignore
    supabase.auth.getClaims().then(({ data: { claims } }) => {
        setClaims(claims)
        setLoading(false)
      })

    // 2) Listen for sign-in/sign-out/token refresh
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
        //@ts-ignore
        supabase.auth.getClaims().then(({ data: { claims } }) => {
            setClaims(claims);
        });
      }
        

      if (!session) {
        setUser(null);
        setClaims(null);
        setSession(null);
        setLoading(false);
        router.replace('/auth/login');
        return;
      }

      setSession(session ?? null);
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, password: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Supabase sign in error:', error.message);
        throw new Error(error.message);
      }
    } catch (error: any) {
      const message = error?.message || 'An unknown error occurred during sign in';
      console.error('signInWithEmail error:', message);
      // Optionally surface via Alert if desired:
      // Alert.alert(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail(email: string, password: string, name: string): Promise<Session | null> {
    setLoading(true);
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Supabase sign up error:', error.message);
        throw new Error(error.message);
      }

      if (!session) {
       console.error('Please check your inbox for email verification!');
       return null;
      } 
      return session;
    } catch (error: any) {
      const message = error?.message || 'An unknown error occurred during sign up';
      console.error('signUpWithEmail error:', message);
      // Optionally surface via Alert if desired:
      // Alert.alert(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // onAuthStateChanged will handle user state
    } catch (error: any) {
      console.error('Logout error:', error.code, error.message);
      throw new Error(error.code + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isAuth = async () => {
    const sesh = await supabase.auth.getSession()
    if (sesh.error){
        return false
    }
    else if (sesh.data){
        return true
    }
    return null
  };

  const value = useMemo(() => ({ session, loading, user, claims, signUpWithEmail, signInWithEmail, logout, isAuth }), [session, loading, user, claims])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}