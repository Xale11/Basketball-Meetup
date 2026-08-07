import { QueryClient } from '@tanstack/react-query'

/**
 * Shared query defaults. These used to be copy-pasted into every hook (and
 * omitted from a few, which made those screens behave differently).
 *
 * Note `refetchOnWindowFocus` is deliberately left at its default of `true`:
 * combined with the AppState -> focusManager bridge in lib/reactQueryFocus.ts,
 * that is what refreshes data when the app returns to the foreground. Setting
 * it to `false` (as every hook previously did) is what made the app feel stale.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
})
