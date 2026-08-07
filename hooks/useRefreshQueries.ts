import { useCallback, useMemo, useState } from 'react'
import { QueryKey, useQueryClient } from '@tanstack/react-query'

/**
 * Pull-to-refresh helper.
 *
 * Invalidates the given query keys and stays "refreshing" until they've all
 * settled, so the spinner reflects real work. Pass the broadest key that covers
 * the screen (e.g. `qk.events.all`) rather than listing every leaf.
 */
export function useRefreshQueries(keys: QueryKey[]) {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  // Keys are usually built inline, so memoise on their serialised value rather
  // than on array identity.
  const serialised = JSON.stringify(keys)
  const stableKeys = useMemo(() => keys, [serialised]) // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all(
        stableKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
    } finally {
      setRefreshing(false)
    }
  }, [queryClient, stableKeys])

  return { refreshing, onRefresh }
}
