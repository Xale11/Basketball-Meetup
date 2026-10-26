import { useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'
import { CalendarBooking, Venue, isReserved } from '@/types/AC_courtBooking'
import { formatCountdown } from '@/lib/AC_courtPricing'

/**
 * One day of the booking calendar, laid out like a sports-centre booking
 * sheet: a column per court, an hour per row. Reserved sessions are amber,
 * confirmed ones green; tapping a block opens its event.
 */

const HOUR_HEIGHT = 64
const GUTTER = 44
const DEFAULT_FIRST_HOUR = 8
const DEFAULT_LAST_HOUR = 22 // exclusive end of the grid

interface Props {
  day: Date
  venues: Venue[]
  bookings: CalendarBooking[]
  now: number
}

const minutesIntoDay = (d: Date) => d.getHours() * 60 + d.getMinutes()
const hhmm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export function AC_BookingDayTimeline({ day, venues, bookings, now }: Props) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)

  // Widen the grid if a booking falls outside the default hours.
  const [firstHour, lastHour] = useMemo(() => {
    let first = DEFAULT_FIRST_HOUR
    let last = DEFAULT_LAST_HOUR
    for (const b of bookings) {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      first = Math.min(first, start.getHours())
      last = Math.max(last, end.getDate() !== start.getDate() ? 24 : Math.ceil(minutesIntoDay(end) / 60))
    }
    return [first, Math.min(last, 24)]
  }, [bookings])

  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i)
  const gridHeight = hours.length * HOUR_HEIGHT
  const top = (minutes: number) => ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT

  // Open on the day's first booking (or the evening, when courts are busiest).
  const scrollRef = useRef<ScrollView>(null)
  const firstBookingHour = bookings.length
    ? Math.min(...bookings.map((b) => new Date(b.start_date).getHours()))
    : 17
  const dayKey = day.toDateString()
  useEffect(() => {
    const y = Math.max(firstBookingHour - 1 - firstHour, 0) * HOUR_HEIGHT
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 0)
    return () => clearTimeout(id)
    // Only when the day changes or its first booking moves, not on every refetch.
  }, [dayKey, firstBookingHour, firstHour])

  const isToday = new Date(now).toDateString() === day.toDateString()
  const nowMinutes = minutesIntoDay(new Date(now))
  const showNowLine = isToday && nowMinutes >= firstHour * 60 && nowMinutes < lastHour * 60

  return (
    <View style={s.wrap}>
      {/* Court names */}
      <View style={s.headerRow}>
        <View style={{ width: GUTTER }} />
        {venues.map((v) => (
          <View key={v.id} style={s.headerCell}>
            <Text style={s.headerText} numberOfLines={2}>
              {v.name}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView ref={scrollRef} style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.grid, { height: gridHeight }]}>
          {/* Hour lines + labels */}
          {hours.map((h, i) => (
            <View key={h} style={[s.hourRow, { top: i * HOUR_HEIGHT }]}>
              <Text style={s.hourLabel}>{`${h.toString().padStart(2, '0')}:00`}</Text>
              <View style={s.hourLine} />
            </View>
          ))}

          {/* Court columns */}
          <View style={[s.columns, { left: GUTTER }]}>
            {venues.map((v) => (
              <View key={v.id} style={s.column}>
                {bookings
                  .filter((b) => b.venue_id === v.id)
                  .map((b) => {
                    const start = new Date(b.start_date)
                    const end = new Date(b.end_date)
                    const startMin = minutesIntoDay(start)
                    const endMin = end.toDateString() === start.toDateString() ? minutesIntoDay(end) : 24 * 60
                    const reserved = isReserved(b.status)
                    const tone = reserved ? theme.colors.warningTone : theme.colors.successTone
                    const height = Math.max(top(endMin) - top(startMin), 36)
                    const holdLeft = reserved ? formatCountdown(b.hold_expires_at, now) : null

                    return (
                      <TouchableOpacity
                        key={b.event_id}
                        activeOpacity={0.85}
                        onPress={() => router.push({ pathname: '/event/[id]', params: { id: b.event_id } })}
                        style={[
                          s.block,
                          { top: top(startMin), height, backgroundColor: tone.bg, borderColor: tone.border },
                        ]}
                      >
                        <View style={[s.blockStripe, { backgroundColor: tone.solid }]} />
                        <View style={s.blockBody}>
                          <Text style={[s.blockStatus, { color: tone.text }]} numberOfLines={1}>
                            {reserved ? 'RESERVED' : 'CONFIRMED'}
                          </Text>
                          <Text style={s.blockTime} numberOfLines={1}>
                            {hhmm(start)}–{hhmm(end)}
                          </Text>
                          {height >= 56 && (
                            <Text style={s.blockName} numberOfLines={height >= 90 ? 2 : 1}>
                              {b.event_name}
                            </Text>
                          )}
                          {height >= 76 && (
                            <Text style={[s.blockMeta, { color: tone.text }]} numberOfLines={2}>
                              {reserved
                                ? `${b.committed_count}/${b.min_players} paid${holdLeft ? ` · ${holdLeft} left` : ''}`
                                : `${b.committed_count} players`}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
              </View>
            ))}
          </View>

          {showNowLine && (
            <View style={[s.nowLine, { top: top(nowMinutes), left: GUTTER - 4 }]}>
              <View style={s.nowDot} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1 },
    headerRow: {
      flexDirection: 'row',
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.canvas,
    },
    headerCell: { flex: 1, paddingHorizontal: 4 },
    headerText: { ...t.typography.caption, color: t.colors.textBody, textAlign: 'center' },

    scroll: { flex: 1 },
    grid: { position: 'relative', marginBottom: t.spacing.xxl },
    hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
    hourLabel: {
      ...t.typography.caption,
      width: GUTTER,
      color: t.colors.textFaint,
      fontVariant: ['tabular-nums'],
      marginTop: -7,
      paddingLeft: 4,
    },
    hourLine: { flex: 1, height: 1, backgroundColor: t.colors.border },

    columns: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row' },
    column: {
      flex: 1,
      position: 'relative',
      borderLeftWidth: 1,
      borderLeftColor: t.colors.border,
    },

    block: {
      position: 'absolute',
      left: 3,
      right: 3,
      borderRadius: t.radius.sm,
      borderWidth: 1,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    blockStripe: { width: 4 },
    blockBody: { flex: 1, paddingHorizontal: 6, paddingVertical: 4, gap: 1 },
    blockStatus: { ...t.typography.badge, fontSize: 9, letterSpacing: 0.6 },
    blockTime: { ...t.typography.caption, fontSize: 11, color: t.colors.textPrimary, fontVariant: ['tabular-nums'] },
    blockName: { ...t.typography.caption, fontSize: 11, color: t.colors.textBody },
    blockMeta: { ...t.typography.caption, fontSize: 10 },

    nowLine: {
      position: 'absolute',
      right: 0,
      height: 2,
      backgroundColor: t.colors.dangerTone.solid,
    },
    nowDot: {
      position: 'absolute',
      left: -3,
      top: -3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.dangerTone.solid,
    },
  })
