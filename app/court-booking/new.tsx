import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { X, MapPin, Clock, Users, Hourglass, Coins } from 'lucide-react-native';
import DateTimeInput from '@/components/DateTimeInput';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { FormAlert } from '@/components/ui/FormAlert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { AC_useVenues } from '@/hooks/courtBooking/AC_useVenues';
import { AC_useCreateCourtSession } from '@/hooks/courtBooking/AC_useCreateCourtSession';
import { formatMinutes, formatPence, sharePence } from '@/lib/AC_courtPricing';

/**
 * Book a university court (ActivCampus). Reserves the court for a short window
 * while players commit; it is booked once the minimum have paid.
 *
 * Opened from the Create screen's Paid → "Split court cost" option, which
 * passes what was already entered (name, description, start/end) as params.
 */

const DURATIONS = [60, 90, 120];

// The spec's reservation window: 6 or 12 hours. In a demo, the organiser's
// "Expire hold now" control ends it early instead.
const HOLD_WINDOWS = [360, 720];
const DEFAULT_HOLD = 360;

const MIN_PLAYERS_FLOOR = 2;
const MAX_PLAYERS_CEILING = 30;

export default function NewCourtSessionScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const { venues, loading: venuesLoading } = AC_useVenues(user?.university_id ?? null);
  const { createCourtSession, loading } = AC_useCreateCourtSession();

  const prefill = useLocalSearchParams<{ name?: string; description?: string; startsAt?: string; endsAt?: string }>();
  const prefillMinutes =
    prefill.startsAt && prefill.endsAt
      ? Math.round((new Date(prefill.endsAt).getTime() - new Date(prefill.startsAt).getTime()) / 60_000)
      : 0;

  const [venueId, setVenueId] = useState<string | null>(null);
  const [name, setName] = useState(prefill.name ?? '');
  const [description, setDescription] = useState(prefill.description ?? '');
  const [startsAt, setStartsAt] = useState(prefill.startsAt ?? '');
  const [duration, setDuration] = useState(prefillMinutes > 0 ? prefillMinutes : 60);
  // Keep a duration carried over from the Create screen selectable even when
  // it isn't one of the presets.
  const durations = DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b);
  const [minPlayers, setMinPlayers] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [holdMinutes, setHoldMinutes] = useState(DEFAULT_HOLD);
  const [error, setError] = useState<string | null>(null);

  const venue = venues.find((v) => v.id === venueId) ?? null;
  const commitment = venue ? sharePence(venue.court_cost_pence, minPlayers) : null;
  const best = venue ? sharePence(venue.court_cost_pence, maxPlayers) : null;

  const endsAt = useMemo(
    () => (startsAt ? new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString() : ''),
    [startsAt, duration],
  );

  // The reservation can't outlast the session's start (the server caps it too).
  const holdCappedByStart =
    !!startsAt && new Date(startsAt).getTime() < Date.now() + holdMinutes * 60_000;

  const setMin = (n: number) => {
    const next = Math.min(Math.max(n, MIN_PLAYERS_FLOOR), MAX_PLAYERS_CEILING);
    setMinPlayers(next);
    if (maxPlayers < next) setMaxPlayers(next);
  };
  const setMax = (n: number) => setMaxPlayers(Math.min(Math.max(n, minPlayers), MAX_PLAYERS_CEILING));

  const submit = () => {
    if (!venue) return setError('Choose a court.');
    if (!startsAt) return setError('Choose when the session starts.');
    if (new Date(startsAt).getTime() <= Date.now()) return setError('The session must start in the future.');
    setError(null);

    createCourtSession(
      {
        venueId: venue.id,
        name: name.trim() || `Court session · ${venue.name}`,
        description: description.trim() || undefined,
        startsAt,
        endsAt,
        minPlayers,
        maxPlayers,
        holdMinutes,
      },
      {
        onSuccess: ({ eventId }) => {
          // Close this sheet and the Create sheet beneath it, then open the event.
          if (router.canDismiss()) router.dismissAll();
          router.push({ pathname: '/event/[id]', params: { id: eventId } });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>Book a court</Text>
          <Text style={s.subtitle}>Reserve a university court and split the cost</Text>
        </View>
        <TouchableOpacity style={s.closeButton} onPress={() => router.back()} accessibilityLabel="Close">
          <X size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Court */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Court *</Text>
          {venuesLoading ? (
            <LoadingSpinner />
          ) : venues.length === 0 ? (
            <Text style={s.muted}>No bookable courts at your university yet.</Text>
          ) : (
            <View style={s.venueList}>
              {venues.map((v) => {
                const active = v.id === venueId;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[s.venueCard, active && s.venueCardActive]}
                    onPress={() => setVenueId(v.id)}
                    activeOpacity={0.85}
                  >
                    <MapPin size={16} color={active ? theme.colors.accentTone.solid : theme.colors.textMuted} />
                    <View style={s.venueText}>
                      <Text style={[s.venueName, active && s.venueNameActive]}>{v.name}</Text>
                      {v.address ? <Text style={s.muted}>{v.address}</Text> : null}
                    </View>
                    <Text style={[s.venuePrice, active && s.venueNameActive]}>
                      {formatPence(v.court_cost_pence)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* When */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>When? *</Text>
          <DateTimeInput
            label="Start"
            defaultValue="Select start"
            initialValue={startsAt || undefined}
            onChange={(val) => {
              setStartsAt(val);
              return true;
            }}
          />
          <View style={[s.row, s.rowGap]}>
            <Clock size={14} color={theme.colors.textMuted} />
            <Text style={s.subLabel}>Duration</Text>
          </View>
          <View style={s.chipWrap}>
            {durations.map((d) => (
              <Chip key={d} label={formatMinutes(d)} active={duration === d} onPress={() => setDuration(d)} styles={s} />
            ))}
          </View>
        </View>

        {/* Players */}
        <View style={s.section}>
          <View style={s.row}>
            <Users size={14} color={theme.colors.textMuted} />
            <Text style={s.sectionLabel}>Players</Text>
          </View>
          <Text style={s.muted}>The court is only booked once the minimum have paid.</Text>
          <Stepper label="Minimum" value={minPlayers} onChange={setMin} styles={s} />
          <Stepper label="Maximum" value={maxPlayers} onChange={setMax} styles={s} />
        </View>

        {/* Reservation window */}
        <View style={s.section}>
          <View style={s.row}>
            <Hourglass size={14} color={theme.colors.textMuted} />
            <Text style={s.sectionLabel}>Reservation window</Text>
          </View>
          <Text style={s.muted}>
            How long the court stays reserved while players commit. If the minimum isn't reached in time,
            the court is released and nobody is charged.
          </Text>
          <View style={s.chipWrap}>
            {HOLD_WINDOWS.map((m) => (
              <Chip
                key={m}
                label={formatMinutes(m)}
                active={holdMinutes === m}
                onPress={() => setHoldMinutes(m)}
                styles={s}
              />
            ))}
          </View>
          {holdCappedByStart && (
            <Text style={s.note}>The session starts sooner than that, so the reservation ends at the start time.</Text>
          )}
        </View>

        {/* Summary */}
        {venue && commitment != null && best != null && (
          <View style={s.summary}>
            <View style={s.row}>
              <Coins size={14} color={theme.colors.accentTone.solid} />
              <Text style={s.summaryLabel}>Cost split</Text>
            </View>
            <Text style={s.summaryBig}>{formatPence(commitment)} per player, at most</Text>
            <Text style={s.summaryText}>
              {formatPence(venue.court_cost_pence)} court ÷ {minPlayers} minimum. If all {maxPlayers} places fill,
              everyone pays {formatPence(best)} and gets the difference back.
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Name</Text>
          <TextInputField
            value={name}
            onChangeText={setName}
            placeholder={venue ? `Court session · ${venue.name}` : 'e.g. Sunday basketball'}
            maxLength={80}
          />
        </View>
        <View style={s.section}>
          <Text style={s.sectionLabel}>Description</Text>
          <TextInputField
            value={description}
            onChangeText={setDescription}
            placeholder="Level, format, what to bring..."
            multiline
            numberOfLines={3}
            multilineHeight={90}
          />
        </View>

        {error && <FormAlert message={error} style={s.alert} />}
        <View style={s.bottomPadding} />
      </ScrollView>

      <View style={s.footer}>
        <Button
          label={commitment != null ? `Reserve court · ${formatPence(commitment)} each` : 'Reserve court'}
          onPress={submit}
          loading={loading}
          disabled={!venue || !startsAt}
        />
      </View>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stepper({
  label,
  value,
  onChange,
  styles,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => onChange(value - 1)}
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => onChange(value + 1)}
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
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
      paddingVertical: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.chromeBorder,
    },
    headerText: { flex: 1, gap: 2 },
    title: { ...t.typography.h1, color: t.colors.textPrimary },
    subtitle: { ...t.typography.caption, color: t.colors.textMuted },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },

    content: { flex: 1, paddingHorizontal: t.spacing.lg },
    section: { marginTop: t.spacing.xl, gap: t.spacing.sm },
    sectionLabel: { ...t.typography.h3, color: t.colors.textPrimary },
    subLabel: { ...t.typography.label, color: t.colors.textMuted },
    muted: { ...t.typography.caption, color: t.colors.textMuted },
    note: { ...t.typography.caption, color: t.colors.warningTone.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowGap: { marginTop: t.spacing.sm },

    venueList: { gap: t.spacing.sm },
    venueCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    venueCardActive: { backgroundColor: t.colors.accentTone.bg, borderColor: t.colors.accentTone.border },
    venueText: { flex: 1, gap: 2 },
    venueName: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    venueNameActive: { color: t.colors.accentTone.text },
    venuePrice: { ...t.typography.bodyStrong, color: t.colors.textBody },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    chip: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    chipActive: { backgroundColor: t.colors.accentTone.bg, borderColor: t.colors.accentTone.border },
    chipText: { ...t.typography.label, color: t.colors.textMuted },
    chipTextActive: { color: t.colors.accentTone.text },

    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: t.spacing.md,
      paddingLeft: t.spacing.lg,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    stepperLabel: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    stepperControls: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
    stepperButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: { ...t.typography.h3, color: t.colors.textPrimary },
    stepperValue: { ...t.typography.h2, color: t.colors.textPrimary, minWidth: 28, textAlign: 'center' },

    summary: {
      marginTop: t.spacing.xl,
      padding: t.spacing.lg,
      gap: t.spacing.xs,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    summaryLabel: { ...t.typography.microLabel, color: t.colors.accentTone.text },
    summaryBig: { ...t.typography.h2, color: t.colors.textPrimary },
    summaryText: { ...t.typography.body, color: t.colors.textBody },

    alert: { marginTop: t.spacing.xl },
    bottomPadding: { height: t.spacing.xxl },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderTopWidth: 1,
      borderTopColor: t.colors.chromeBorder,
    },
  });
