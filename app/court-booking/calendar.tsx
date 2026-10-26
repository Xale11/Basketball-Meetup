import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { AC_useVenues } from '@/hooks/courtBooking/AC_useVenues';
import { AC_useBookingCalendar, startOfWeek } from '@/hooks/courtBooking/AC_useBookingCalendar';
import { AC_useNow } from '@/hooks/courtBooking/AC_useNow';
import { AC_BookingDayTimeline } from '@/components/activCampus/courtBooking/AC_BookingDayTimeline';
import { isReserved } from '@/types/AC_courtBooking';

/**
 * The university's booking calendar (ActivCampus court bookings): every court,
 * hour by hour, with sessions Reserved (amber, still collecting commitments)
 * or Confirmed (green, minimum paid). Read-only: tap a block to open its event.
 */

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

export default function BookingCalendarScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const now = AC_useNow(30_000);

  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const weekStart = startOfWeek(selectedDay);
  const { bookings, loading, fetching } = AC_useBookingCalendar(weekStart);
  const { venues, loading: venuesLoading } = AC_useVenues(user?.university_id ?? null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart.getTime()]);
  const dayBookings = bookings.filter((b) => new Date(b.start_date).toDateString() === selectedDay.toDateString());

  const weekLabel = `${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const todayKey = new Date(now).toDateString();

  const reservedCount = dayBookings.filter((b) => isReserved(b.status)).length;
  const confirmedCount = dayBookings.length - reservedCount;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconButton} onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.title}>Court bookings</Text>
          <Text style={s.subtitle}>{venues[0]?.address ?? 'University courts'}</Text>
        </View>
        {fetching && <ActivityIndicator size="small" color={theme.colors.textMuted} />}
      </View>

      {/* Week navigation */}
      <View style={s.weekNav}>
        <TouchableOpacity
          style={s.iconButton}
          onPress={() => setSelectedDay((d) => addDays(d, -7))}
          accessibilityLabel="Previous week"
        >
          <ChevronLeft size={18} color={theme.colors.textBody} />
        </TouchableOpacity>
        <Text style={s.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          style={s.iconButton}
          onPress={() => setSelectedDay((d) => addDays(d, 7))}
          accessibilityLabel="Next week"
        >
          <ChevronRight size={18} color={theme.colors.textBody} />
        </TouchableOpacity>
      </View>

      {/* Day strip: a dot per booking, amber = reserved, green = confirmed */}
      <View style={s.dayStrip}>
        {days.map((d, i) => {
          const active = d.toDateString() === selectedDay.toDateString();
          const isToday = d.toDateString() === todayKey;
          const onDay = bookings.filter((b) => new Date(b.start_date).toDateString() === d.toDateString());
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[s.dayCell, active && s.dayCellActive]}
              onPress={() => setSelectedDay(d)}
              activeOpacity={0.8}
            >
              <Text style={[s.dayName, active && s.dayTextActive]}>{DAY_LABELS[i]}</Text>
              <Text style={[s.dayNumber, active && s.dayTextActive, isToday && !active && s.dayToday]}>
                {d.getDate()}
              </Text>
              <View style={s.dots}>
                {onDay.slice(0, 4).map((b) => (
                  <View
                    key={b.event_id}
                    style={[
                      s.dot,
                      {
                        backgroundColor: isReserved(b.status)
                          ? theme.colors.warningTone.solid
                          : theme.colors.successTone.solid,
                      },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend + day summary */}
      <View style={s.legend}>
        <LegendItem color={theme.colors.warningTone.solid} label="Reserved — collecting payments" styles={s} />
        <LegendItem color={theme.colors.successTone.solid} label="Confirmed — minimum paid" styles={s} />
      </View>
      <Text style={s.daySummary}>
        {selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        {dayBookings.length > 0
          ? ` · ${confirmedCount} confirmed, ${reservedCount} reserved`
          : ' · No bookings'}
      </Text>

      {loading || venuesLoading ? (
        <ActivityIndicator style={s.loader} color={theme.colors.accent} />
      ) : venues.length === 0 ? (
        <Text style={s.empty}>No bookable courts at your university yet.</Text>
      ) : (
        <AC_BookingDayTimeline day={selectedDay} venues={venues} bookings={dayBookings} now={now} />
      )}
    </SafeAreaView>
  );
}

function LegendItem({
  color,
  label,
  styles,
}: {
  color: string;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.chromeBorder,
    },
    headerText: { flex: 1, gap: 2 },
    title: { ...t.typography.h2, color: t.colors.textPrimary },
    subtitle: { ...t.typography.caption, color: t.colors.textMuted },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },

    weekNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
    },
    weekLabel: { ...t.typography.bodyStrong, color: t.colors.textPrimary },

    dayStrip: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: t.spacing.md,
      paddingTop: t.spacing.md,
    },
    dayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      gap: 2,
    },
    dayCellActive: { backgroundColor: t.colors.accentTone.bg, borderColor: t.colors.accentTone.border },
    dayName: { ...t.typography.caption, fontSize: 11, color: t.colors.textMuted },
    dayNumber: { ...t.typography.h3, color: t.colors.textPrimary },
    dayTextActive: { color: t.colors.accentTone.text },
    dayToday: { color: t.colors.accentHi },
    dots: { flexDirection: 'row', gap: 2, height: 6, alignItems: 'center' },
    dot: { width: 5, height: 5, borderRadius: 3 },

    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendSwatch: { width: 10, height: 10, borderRadius: 3 },
    legendText: { ...t.typography.caption, color: t.colors.textMuted },
    daySummary: {
      ...t.typography.label,
      color: t.colors.textBody,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
    },

    loader: { marginTop: t.spacing.xxl },
    empty: {
      ...t.typography.body,
      color: t.colors.textMuted,
      textAlign: 'center',
      marginTop: t.spacing.xxl,
    },
  });
