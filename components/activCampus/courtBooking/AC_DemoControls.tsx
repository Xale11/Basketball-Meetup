import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { FlaskConical } from 'lucide-react-native'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'
import { AC_useDemoControls } from '@/hooks/courtBooking/AC_useDemoControls'
import { CourtPhase } from '@/lib/AC_courtSessionState'

/**
 * Organiser-only demo controls (EXPO_PUBLIC_DEMO_MODE). They drive the real
 * flow faster: demo players pay with Stripe test cards, and the deadlines are
 * moved to now. Shown inside the court session panel.
 */
export function AC_DemoControls({ eventId, phase }: { eventId: string; phase: CourtPhase }) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)
  const { simulatePlayers, expireHoldNow, closeRegistrationNow, loading } = AC_useDemoControls(eventId)

  const onError = (err: Error) => Alert.alert('Demo control failed', err.message)
  const canAddPlayers = phase === 'reserved' || phase === 'confirmed'

  const buttons = [
    { label: '+1 player', enabled: canAddPlayers, onPress: () => simulatePlayers(1, { onError }) },
    { label: '+5 players', enabled: canAddPlayers, onPress: () => simulatePlayers(5, { onError }) },
    {
      label: 'Expire hold now',
      enabled: phase === 'reserved',
      onPress: () =>
        Alert.alert('Expire the hold?', 'The reservation ends now. Held cards are released.', [
          { text: 'Back', style: 'cancel' },
          { text: 'Expire', style: 'destructive', onPress: () => expireHoldNow(undefined, { onError }) },
        ]),
    },
    {
      label: 'Close registration now',
      enabled: phase === 'confirmed',
      onPress: () =>
        Alert.alert('Close registration?', 'The player list is frozen and refunds of the difference go out.', [
          { text: 'Back', style: 'cancel' },
          { text: 'Close', onPress: () => closeRegistrationNow(undefined, { onError }) },
        ]),
    },
  ]

  return (
    <View style={s.card}>
      <View style={s.header}>
        <FlaskConical size={14} color={theme.colors.infoTone.solid} />
        <Text style={s.title}>Demo controls</Text>
        {loading && <ActivityIndicator size="small" color={theme.colors.infoTone.solid} />}
      </View>
      <Text style={s.caption}>Demo players pay with Stripe test cards. Only you can see this.</Text>
      <View style={s.grid}>
        {buttons.map((b) => {
          const disabled = !b.enabled || loading
          return (
            <TouchableOpacity
              key={b.label}
              style={[s.button, disabled && s.buttonDisabled]}
              onPress={b.onPress}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text style={s.buttonText}>{b.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.infoTone.bg,
      borderColor: t.colors.infoTone.border,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { ...t.typography.microLabel, color: t.colors.infoTone.text, flex: 1 },
    caption: { ...t.typography.caption, color: t.colors.textMuted },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    button: {
      flexGrow: 1,
      flexBasis: '45%',
      alignItems: 'center',
      paddingVertical: t.spacing.md,
      borderRadius: t.radius.chip,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.infoTone.border,
    },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { ...t.typography.label, color: t.colors.infoTone.text },
  })
