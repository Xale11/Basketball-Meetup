/**
 * Display maths for court bookings. The server (`ac_compute_split`) is the
 * source of truth for what anyone actually pays; these helpers only preview
 * it, using the same rules: commitment = ceil(cost / min), final share =
 * cost / eligible players with the odd pence going to the earliest joiners.
 */

/** 1500 → "£15", 1250 → "£12.50". */
export const formatPence = (pence: number): string => {
  const pounds = pence / 100
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`
}

/** The most a player can pay for a share of `cost` among `players` (rounded up to the penny). */
export const sharePence = (costPence: number, players: number): number =>
  Math.ceil(costPence / Math.max(players, 1))

/** What each player would pay if registration closed now with `committed` players. */
export const currentSharePence = (costPence: number, committed: number, minPlayers: number): number =>
  sharePence(costPence, Math.max(committed, minPlayers))

/** "1 h 30 min", "15 min", "2 h". */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Time left until `iso`, e.g. "12:04" under an hour, "3 h 20 min" after. Null once passed. */
export const formatCountdown = (iso: string, now: number): string | null => {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  return formatMinutes(Math.floor(totalSeconds / 60))
}
