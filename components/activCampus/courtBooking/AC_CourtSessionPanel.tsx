import { View, Text, StyleSheet } from 'react-native'
import { CalendarCheck, CalendarClock, CalendarX, Coins, Hourglass, Users } from 'lucide-react-native'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'
import { CourtSessionDetail, SessionParticipant } from '@/types/AC_courtBooking'
import { CourtPhase, CourtViewState } from '@/lib/AC_courtSessionState'
import { formatCountdown, formatPence } from '@/lib/AC_courtPricing'
import { demoMode } from '@/constants/AC_demoMode'
import { AC_DemoControls } from './AC_DemoControls'

interface Props {
  detail: CourtSessionDetail
  mine: SessionParticipant | null
  view: CourtViewState
  now: number
  isOrganiser: boolean
}

type Tone = 'warningTone' | 'successTone' | 'neutralTone' | 'dangerTone' | 'accentTone'

const PHASE_META: Record<CourtPhase, { label: string; tone: Tone }> = {
  reserved: { label: 'Reserved', tone: 'warningTone' },
  confirming: { label: 'Confirming…', tone: 'accentTone' },
  confirmed: { label: 'Court booked', tone: 'successTone' },
  closed: { label: 'Registration closed', tone: 'neutralTone' },
  cancelled: { label: 'Not booked', tone: 'dangerTone' },
}

/**
 * The court-booking half of the event screen: whether the court is Reserved
 * or Booked, progress to the minimum, what everyone pays, and the viewer's own
 * money. The footer button (AC_CourtSessionAction) handles joining/cancelling.
 */
export function AC_CourtSessionPanel({ detail, mine, view, now, isOrganiser }: Props) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)
  const { session, venue, committedCount, placesTaken } = detail
  const meta = PHASE_META[view.phase]
  const tone = theme.colors[meta.tone]

  const holdLeft = formatCountdown(session.hold_expires_at, now)
  const closesLeft = formatCountdown(session.registration_closes_at, now)
  const needed = Math.max(session.min_players - committedCount, 0)
  const progress = Math.min(committedCount / session.min_players, 1)

  const StatusIcon =
    view.phase === 'reserved' ? CalendarClock : view.phase === 'cancelled' ? CalendarX : CalendarCheck

  let statusLine: string
  switch (view.phase) {
    case 'reserved':
      statusLine = holdLeft
        ? `Temporary hold on ${venue.name}. ${needed} more ${needed === 1 ? 'player' : 'players'} needed in ${holdLeft} to book it.`
        : 'The reservation window has ended.'
      break
    case 'confirming':
      statusLine = 'The minimum was reached. Taking payments and booking the court now.'
      break
    case 'confirmed':
      statusLine = closesLeft
        ? `${venue.name} is booked. Players can still join until 15 minutes after the start (${closesLeft}), lowering everyone's share.`
        : `${venue.name} is booked.`
      break
    case 'closed':
      statusLine = 'The player list is final and the cost has been split.'
      break
    case 'cancelled':
      statusLine = 'Not enough players committed in time, so the court was released. Nobody was charged.'
      break
  }

  return (
    <View style={s.wrap}>
      {/* Status */}
      <View style={[s.statusCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <View style={s.statusHeader}>
          <StatusIcon size={18} color={tone.solid} />
          <Text style={[s.statusLabel, { color: tone.text }]}>{meta.label}</Text>
          {view.phase === 'reserved' && holdLeft && (
            <View style={[s.timerPill, { borderColor: tone.border }]}>
              <Hourglass size={11} color={tone.text} />
              <Text style={[s.timerText, { color: tone.text }]}>{holdLeft}</Text>
            </View>
          )}
        </View>
        <Text style={s.statusLine}>{statusLine}</Text>
      </View>

      {/* Progress */}
      <View style={s.card}>
        <View style={s.rowBetween}>
          <View style={s.row}>
            <Users size={14} color={theme.colors.accentHi} />
            <Text style={s.cardLabel}>Players</Text>
          </View>
          <Text style={s.cardValue}>
            {committedCount} committed · {placesTaken} / {session.max_players} places
          </Text>
        </View>
        <View style={s.track}>
          <View
            style={[
              s.fill,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress >= 1 ? theme.colors.successTone.solid : theme.colors.warningTone.solid,
              },
            ]}
          />
        </View>
        <Text style={s.caption}>
          {committedCount >= session.min_players
            ? `Minimum of ${session.min_players} reached.`
            : `${session.min_players} needed to book the court.`}
        </Text>
      </View>

      {/* Price */}
      <View style={s.card}>
        <View style={s.row}>
          <Coins size={14} color={theme.colors.accentHi} />
          <Text style={s.cardLabel}>Cost split</Text>
        </View>
        <View style={s.priceGrid}>
          <PriceCell label="Court" value={formatPence(session.court_cost_pence)} styles={s} />
          <PriceCell label="Most you pay" value={formatPence(session.commitment_pence)} styles={s} />
          <PriceCell
            label={view.phase === 'closed' ? 'Final share' : 'Share right now'}
            value={formatPence(view.currentShare)}
            styles={s}
            highlight
          />
        </View>
        {view.phase !== 'closed' && view.phase !== 'cancelled' && (
          <Text style={s.caption}>
            Everyone commits {formatPence(session.commitment_pence)}. If all {session.max_players} places fill, each
            player pays {formatPence(view.bestShare)} and the difference is refunded when registration closes.
          </Text>
        )}
      </View>

      {/* The viewer's own money */}
      {view.myLine && (
        <View style={[s.card, s.mineCard]}>
          <Text style={s.cardLabel}>Your place</Text>
          <Text style={s.mineText}>{view.myLine}</Text>
        </View>
      )}

      {isOrganiser && demoMode && <AC_DemoControls eventId={session.event_id} phase={view.phase} />}
    </View>
  )
}

function PriceCell({
  label,
  value,
  styles,
  highlight = false,
}: {
  label: string
  value: string
  styles: ReturnType<typeof makeStyles>
  highlight?: boolean
}) {
  return (
    <View style={[styles.priceCell, highlight && styles.priceCellHighlight]}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, highlight && styles.priceValueHighlight]}>{value}</Text>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.md, marginTop: t.spacing.lg },
    statusCard: {
      borderRadius: t.radius.card,
      borderWidth: 1,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    statusHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    statusLabel: { ...t.typography.h3, flex: 1 },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
      borderRadius: t.radius.pill,
      borderWidth: 1,
    },
    timerText: { ...t.typography.badge, fontVariant: ['tabular-nums'] },
    statusLine: { ...t.typography.body, color: t.colors.textBody },

    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    mineCard: { borderColor: t.colors.accentTone.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm },
    cardLabel: { ...t.typography.microLabel, color: t.colors.textMuted },
    cardValue: { ...t.typography.label, color: t.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
    caption: { ...t.typography.caption, color: t.colors.textMuted },

    track: {
      height: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: t.radius.pill },

    priceGrid: { flexDirection: 'row', gap: t.spacing.sm },
    priceCell: {
      flex: 1,
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.sm,
      gap: 2,
    },
    priceCellHighlight: { backgroundColor: t.colors.accentTone.bg, borderColor: t.colors.accentTone.border },
    priceLabel: { ...t.typography.caption, color: t.colors.textMuted },
    priceValue: { ...t.typography.h3, color: t.colors.textPrimary },
    priceValueHighlight: { color: t.colors.accentTone.text },

    mineText: { ...t.typography.body, color: t.colors.textBody },
  })
