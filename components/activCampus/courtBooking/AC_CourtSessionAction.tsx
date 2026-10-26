import { useState } from 'react'
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'
import { CourtSessionDetail } from '@/types/AC_courtBooking'
import { CourtViewState } from '@/lib/AC_courtSessionState'
import { formatPence } from '@/lib/AC_courtPricing'
import { paymentsSupported } from '@/lib/AC_paymentSheet'
import { AC_useJoinCourtSession } from '@/hooks/courtBooking/AC_useJoinCourtSession'
import { AC_useCancelCourtPlace } from '@/hooks/courtBooking/AC_useCancelCourtPlace'
import { AC_CancelConfirmSheet } from './AC_CancelConfirmSheet'

/**
 * The event screen's primary button for a court session: join (and pay in
 * Stripe's sheet), rejoin, or cancel. Which one shows comes from
 * `courtViewState`. A place only exists once the card is approved.
 */
export function AC_CourtSessionAction({ detail, view }: { detail: CourtSessionDetail; view: CourtViewState }) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)
  const eventId = detail.session.event_id
  const { joinCourtSession, loading: joining } = AC_useJoinCourtSession()
  const { cancelCourtPlace, loading: cancelling } = AC_useCancelCourtPlace()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const join = () => {
    if (!paymentsSupported) {
      Alert.alert('Mobile only', 'Paying for a court is only available in the ActivCampus app.')
      return
    }
    joinCourtSession(
      { eventId },
      {
        onSuccess: (outcome) => {
          const commitment = formatPence(detail.session.commitment_pence)
          if (outcome === 'paid') {
            Alert.alert(
              "You're in",
              view.phase === 'reserved'
                ? `${commitment} is held on your card. You're only charged once the court is booked.`
                : `You paid ${commitment}. You'll get back the difference when registration closes.`,
            )
          } else if (outcome === 'rejoined') {
            Alert.alert('Welcome back', 'You have your place again. Your original commitment still stands.')
          } else if (outcome === 'processing') {
            Alert.alert('Almost there', 'Your earlier payment is still being confirmed. This updates in a moment.')
          }
          // 'canceled': they closed the sheet. Nothing to say.
        },
        onError: (err) => Alert.alert('Could not join', err.message),
      },
    )
  }

  const cancel = () =>
    cancelCourtPlace(
      { eventId },
      {
        onSuccess: ({ action }) => {
          setConfirmingCancel(false)
          Alert.alert(
            'Place cancelled',
            action === 'VOID'
              ? 'Your card hold was released. You have not been charged.'
              : "Your place is free for someone else. If they take it, you'll be refunded in full.",
          )
        },
        onError: (err) => {
          setConfirmingCancel(false)
          Alert.alert('Could not cancel', err.message)
        },
      },
    )

  const { action } = view
  const busy = joining || cancelling

  if (action.kind === 'none') {
    return (
      <TouchableOpacity style={[s.button, s.disabledButton]} disabled>
        <Text style={s.mutedText}>{action.label}</Text>
      </TouchableOpacity>
    )
  }

  if (action.kind === 'cancel') {
    return (
      <>
        <TouchableOpacity
          style={[s.button, s.cancelButton]}
          onPress={() => setConfirmingCancel(true)}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.textBody} />
          ) : (
            <Text style={s.cancelText}>{action.label}</Text>
          )}
        </TouchableOpacity>
        <AC_CancelConfirmSheet
          visible={confirmingCancel}
          phase={view.phase}
          commitmentPence={detail.session.commitment_pence}
          currentSharePence={view.currentShare}
          loading={cancelling}
          onConfirm={cancel}
          onClose={() => setConfirmingCancel(false)}
        />
      </>
    )
  }

  // join / rejoin both go through `join` (which also resumes an unfinished payment).
  return (
    <TouchableOpacity style={s.button} onPress={join} disabled={busy} activeOpacity={0.85}>
      <LinearGradient
        colors={theme.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, s.gradient]}
      />
      {busy ? (
        <ActivityIndicator color={theme.colors.textOnAccent} />
      ) : (
        <Text style={s.primaryText}>{action.label}</Text>
      )}
    </TouchableOpacity>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    // The event footer stacks its buttons vertically; this fills the width.
    button: {
      minHeight: 52,
      borderRadius: t.radius.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing.lg,
      backgroundColor: t.gradient.primary[0],
    },
    gradient: { borderRadius: t.radius.card },
    primaryText: { ...t.typography.button, color: t.colors.textOnAccent },
    cancelButton: {
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
    },
    cancelText: { ...t.typography.button, color: t.colors.textBody },
    disabledButton: {
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    mutedText: { ...t.typography.button, color: t.colors.textMuted },
  })
