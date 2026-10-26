import { useEffect, useState } from 'react'

/** Current time in ms, re-rendering every `intervalMs` while `active`. Drives countdowns. */
export const AC_useNow = (intervalMs = 1000, active = true): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, active])
  return now
}
