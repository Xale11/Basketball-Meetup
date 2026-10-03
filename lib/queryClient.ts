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
      /**
       * 30s, down from 5 minutes.
       *
       * Five minutes meant a screen you navigated back to served cached data
       * without refetching, so newly created events and incoming friend
       * requests could stay invisible for minutes with nothing the user could
       * do about it. At 30s, any screen you return to refetches, which is what
       * makes the app feel live. Queries that need to be fresher than that set
       * their own `staleTime: 0` and a `refetchInterval` — see
       * `usePendingRequests` and `useNotifications`.
       */
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
})
