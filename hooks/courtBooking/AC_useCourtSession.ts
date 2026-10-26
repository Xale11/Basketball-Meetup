import { useQuery } from '@tanstack/react-query'
import { fetchCourtSession } from '@/api/AC_courtBooking.api'
import { CourtRegistrationStatus, CourtSessionDetail, CourtSessionStatus } from '@/types/AC_courtBooking'
import { useAuth } from '@/hooks/useAuth'
import { qk } from '@/lib/queryKeys'
import { demoMode, DEMO_REFRESH_MS } from '@/constants/AC_demoMode'

/** States where the session changes on its own (payments landing, tick running). */
const LIVE_STATUSES = new Set([
  CourtSessionStatus.PENDING_COMMITMENTS,
  CourtSessionStatus.CONFIRMING_BOOKING,
  CourtSessionStatus.SETTLING,
])

/**
 * The court session behind an event. `courtSession` is null when the event is
 * not a court booking, so the event screen can fall back to its normal join UI.
 */
export const AC_useCourtSession = (eventId: string | undefined | null) => {
  const { user } = useAuth()

  const query = useQuery<CourtSessionDetail | null, Error>({
    queryKey: qk.courtBooking.session(eventId),
    enabled: !!eventId,
    queryFn: () => fetchCourtSession(eventId!),
    staleTime: 0,
    // Live while money is moving: always in demo mode, otherwise while the
    // session is still settling into its next state.
    refetchInterval: (q) => {
      const status = q.state.data?.session.status
      if (!status) return false
      if (demoMode) return DEMO_REFRESH_MS
      return LIVE_STATUSES.has(status) ? 10_000 : false
    },
  })

  const detail = query.data ?? null
  // The user's current place: their ACTIVE or CANCELLED_LIABLE row, else
  // their latest row of any status (e.g. REPLACED, WITHDRAWN).
  const mine = detail?.participants.filter((p) => p.user_id === user?.id) ?? []
  const myParticipant =
    mine.find(
      (p) =>
        p.registration_status === CourtRegistrationStatus.ACTIVE ||
        p.registration_status === CourtRegistrationStatus.CANCELLED_LIABLE,
    ) ??
    mine[mine.length - 1] ??
    null

  return {
    ...query,
    loading: !!eventId && query.isPending,
    fetching: query.isFetching,
    courtSession: detail,
    myParticipant,
    isOrganiser: !!detail && !!user?.id && detail.session.organiser_id === user.id,
  }
}
