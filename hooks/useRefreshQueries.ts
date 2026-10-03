import { useCallback, useMemo, useState } from 'react'
import { QueryKey, useQueryClient } from '@tanstack/react-query'

/**
 * Pull-to-refresh helper.
 *
 * Invalidates the given query keys and stays "refreshing" until they've all
 * settled, so the spinner reflects real work. Pass the broadest key that covers
 * the screen (e.g. `qk.events.all`) rather than listing every leaf.
 */
/** Shortest time the spinner stays up, so a fast refresh is still perceptible. */
const MIN_SPINNER_MS = 400

export function useRefreshQueries(keys: QueryKey[]) {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  // Keys are usually built inline, so memoise on their serialised value rather
  // than on array identity.
  const serialised = JSON.stringify(keys)
  const stableKeys = useMemo(() => keys, [serialised]) // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    const startedAt = Date.now()
    try {
      await Promise.all(
        stableKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    } finally {
      // Hold the spinner for a beat.
      //
      // A warm refetch can settle in well under 100ms — often before the pull
      // gesture has even been released — so the spinner appeared not to run at
      // all and the refresh read as "nothing happened". This floors the visible
      // duration without delaying the data, which is already on screen by then.
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SPINNER_MS - elapsed))
      }
      setRefreshing(false)
    }
  }, [queryClient, stableKeys])

  return { refreshing, onRefresh }
}
