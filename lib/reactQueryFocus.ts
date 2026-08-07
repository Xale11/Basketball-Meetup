import { AppState, AppStateStatus, Platform } from 'react-native'
import { focusManager } from '@tanstack/react-query'

/**
 * Bridges React Native's AppState to React Query's focus manager.
 *
 * React Query's `refetchOnWindowFocus` relies on a browser focus event, which
 * does not exist in React Native — so without this bridge it never fires and
 * nothing is refetched when the user returns to the app. (Setting it to
 * `false` everywhere, as the hooks used to, was a no-op hiding this gap.)
 *
 * Call once at app start; returns an unsubscribe function.
 */
export function setupReactQueryFocus(): () => void {
  if (Platform.OS === 'web') return () => {}

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active')
  }

  const subscription = AppState.addEventListener('change', onAppStateChange)
  return () => subscription.remove()
}
