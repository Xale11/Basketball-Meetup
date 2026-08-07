import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'

/**
 * These are inlined by Metro at build time. On EAS they come from the build
 * profile's environment (`eas env:create --environment <env>`), NOT from the
 * local .env — that file is gitignored and never uploaded. When they are
 * missing, createClient throws a generic "supabaseUrl is required" during
 * module import, which kills the app on launch with no visible error. Fail
 * loudly instead, naming the variable and the fix.
 */
const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Missing ${name}. Local builds read it from .env; EAS builds read it from ` +
        `the build profile's environment — run: eas env:create --scope project ` +
        `--name ${name} --environment <development|preview|production>`
    )
  }
  return value
}

const supabaseUrl = requireEnv(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL
)
const supabaseAnonKey = requireEnv(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}