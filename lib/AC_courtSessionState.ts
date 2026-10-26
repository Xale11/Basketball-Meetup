import {
  CourtPaymentStatus,
  CourtRegistrationStatus,
  CourtSessionDetail,
  CourtSessionStatus,
  SessionParticipant,
} from '@/types/AC_courtBooking'
import { currentSharePence, formatPence } from './AC_courtPricing'

/**
 * Turns a court session + the viewer's participant row into what the event
 * screen shows: the phase, the one action available, and a plain-English line
 * about the viewer's money. The server enforces the same rules; this only
 * decides which button to offer.
 */

export type CourtPhase = 'reserved' | 'confirming' | 'confirmed' | 'closed' | 'cancelled'

export type CourtAction =
  | { kind: 'join'; label: string }
  | { kind: 'finishPayment'; label: string }
  | { kind: 'rejoin'; label: string }
  | { kind: 'cancel'; label: string }
  | { kind: 'none'; label: string }

export interface CourtViewState {
  phase: CourtPhase
  action: CourtAction
  /** One line about the viewer's own place and money, or null if they have none. */
  myLine: string | null
  /** What each player would pay if registration closed now. */
  currentShare: number
  /** Share if every place fills. */
  bestShare: number
  isFull: boolean
  registrationOpen: boolean
}

export const phaseOf = (status: CourtSessionStatus): CourtPhase => {
  switch (status) {
    case CourtSessionStatus.PENDING_COMMITMENTS:
      return 'reserved'
    case CourtSessionStatus.CONFIRMING_BOOKING:
      return 'confirming'
    case CourtSessionStatus.CONFIRMED:
      return 'confirmed'
    case CourtSessionStatus.CANCELLED:
      return 'cancelled'
    default:
      return 'closed'
  }
}

const holdsPlace = (p: SessionParticipant | null) =>
  !!p && p.registration_status === CourtRegistrationStatus.ACTIVE

function describeMine(p: SessionParticipant | null, phase: CourtPhase, currentShare: number): string | null {
  if (!p) return null
  const commitment = formatPence(p.commitment_pence)

  if (p.final_share_pence != null && p.eligible) {
    const share = formatPence(p.final_share_pence)
    if (p.refund_pence <= 0) return `Final share ${share}. Nothing to refund.`
    const refund = formatPence(p.refund_pence)
    return p.payment_status === CourtPaymentStatus.REFUNDED
      ? `Final share ${share}. ${refund} refunded to your card.`
      : `Final share ${share}. ${refund} refund on its way.`
  }

  switch (p.registration_status) {
    case CourtRegistrationStatus.REPLACED:
      return p.payment_status === CourtPaymentStatus.REFUNDED
        ? `Someone took your place, so your ${commitment} was refunded in full.`
        : `Someone took your place. Your ${commitment} refund is on its way.`
    case CourtRegistrationStatus.WITHDRAWN:
      return p.payment_status === CourtPaymentStatus.REFUNDED
        ? `You left. ${formatPence(p.refund_pence)} was refunded.`
        : 'You left. Your card hold was released, so you were not charged.'
    case CourtRegistrationStatus.CANCELLED_LIABLE:
      return `You cancelled. Unless someone takes your place, you still pay your share (currently ${formatPence(currentShare)}).`
  }

  switch (p.payment_status) {
    case CourtPaymentStatus.PAYMENT_PENDING:
      return 'Your place is held while you finish paying.'
    case CourtPaymentStatus.AUTHORISED:
      return phase === 'cancelled'
        ? 'The court was not booked, so your card hold was released.'
        : `${commitment} held on your card. You're only charged if the court is booked.`
    case CourtPaymentStatus.PAID:
      return `You paid ${commitment}. The more people join, the more you get back when registration closes.`
    case CourtPaymentStatus.VOIDED:
      return 'The court was not booked, so your card hold was released. You were not charged.'
    default:
      return null
  }
}

export function courtViewState(
  detail: CourtSessionDetail,
  mine: SessionParticipant | null,
  now: number,
): CourtViewState {
  const { session } = detail
  const phase = phaseOf(session.status)
  const commitment = formatPence(session.commitment_pence)
  // Players who cancelled after confirmation still pay unless replaced, so
  // they count towards the split too.
  const liable = detail.participants.filter(
    (p) =>
      p.registration_status === CourtRegistrationStatus.CANCELLED_LIABLE &&
      p.payment_status === CourtPaymentStatus.PAID,
  ).length
  const currentShare = currentSharePence(
    session.court_cost_pence,
    detail.committedCount + liable,
    session.min_players,
  )
  const bestShare = currentSharePence(session.court_cost_pence, session.max_players, session.min_players)
  const isFull = detail.placesTaken >= session.max_players

  const beforeClose = now < new Date(session.registration_closes_at).getTime()
  const beforeHoldExpiry = now < new Date(session.hold_expires_at).getTime()
  const registrationOpen =
    beforeClose && (phase === 'confirmed' || (phase === 'reserved' && beforeHoldExpiry))

  let action: CourtAction
  if (phase === 'confirming') {
    action = { kind: 'none', label: 'Confirming booking…' }
  } else if (!registrationOpen) {
    action = {
      kind: 'none',
      label: phase === 'cancelled' ? 'Court not booked' : 'Registration closed',
    }
  } else if (holdsPlace(mine) && mine!.payment_status === CourtPaymentStatus.PAYMENT_PENDING) {
    action = { kind: 'finishPayment', label: `Finish paying ${commitment}` }
  } else if (holdsPlace(mine)) {
    action = { kind: 'cancel', label: 'Cancel my place' }
  } else if (mine?.registration_status === CourtRegistrationStatus.CANCELLED_LIABLE) {
    action = isFull
      ? { kind: 'none', label: 'Full' }
      : { kind: 'rejoin', label: 'Rejoin · no extra charge' }
  } else if (isFull) {
    action = { kind: 'none', label: 'Full' }
  } else {
    action = {
      kind: 'join',
      label: phase === 'reserved' ? `Join · hold ${commitment}` : `Join · pay ${commitment}`,
    }
  }

  return {
    phase,
    action,
    myLine: describeMine(mine, phase, currentShare),
    currentShare,
    bestShare,
    isFull,
    registrationOpen,
  }
}
