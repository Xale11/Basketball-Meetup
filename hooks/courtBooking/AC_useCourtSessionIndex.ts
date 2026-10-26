import { useQuery } from '@tanstack/react-query'
import { fetchCourtSessionIndex } from '@/api/AC_courtBooking.api'
import { CourtSession } from '@/types/AC_courtBooking'
import { qk } from '@/lib/queryKeys'

type CourtIndex = Map<string, Pick<CourtSession, 'status' | 'commitment_pence'>>

const EMPTY: CourtIndex = new Map()

/**
 * Which events are court bookings. One shared query, however many event cards
 * are on screen, so each card can tell whether its Join button should open the
 * payment flow instead of joining directly.
 */
export const AC_useCourtSessionIndex = () => {
  const query = useQuery<CourtIndex, Error>({
    queryKey: qk.courtBooking.index,
    queryFn: fetchCourtSessionIndex,
  })

  return {
    ...query,
    loading: query.isPending,
    courtSessions: query.data ?? EMPTY,
  }
}
