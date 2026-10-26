import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'
import { CourtPhase } from '@/lib/AC_courtSessionState'
import { formatPence } from '@/lib/AC_courtPricing'

interface Props {
  visible: boolean
  phase: CourtPhase
  commitmentPence: number
  currentSharePence: number
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * The only way to cancel a court place. There is no undo, so the sheet spells
 * out what happens to the player's money in the current phase, and nothing
 * changes unless they press "Confirm cancellation".
 */
export function AC_CancelConfirmSheet({
  visible,
  phase,
  commitmentPence,
  currentSharePence,
  loading,
  onConfirm,
  onClose,
}: Props) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)
  const commitment = formatPence(commitmentPence)

  const consequences =
    phase === 'reserved'
      ? [
          `The ${commitment} hold on your card is released straight away. You won't be charged.`,
          'Your place goes back to the pool.',
          'You can join again later if there is still space, by paying the commitment again.',
        ]
      : [
          `The court is already booked, so your ${commitment} stays committed for now.`,
          `If someone takes your place before registration closes, you're refunded in full.`,
          `If nobody does, you still pay your final share (currently ${formatPence(currentSharePence)}) like everyone else.`,
          'You can rejoin at no extra charge while your old place is still free.',
        ]

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={loading ? undefined : onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <View style={s.header}>
            <AlertTriangle size={20} color={theme.colors.warningTone.solid} />
            <Text style={s.title}>Cancel your place?</Text>
          </View>

          <View style={s.list}>
            {consequences.map((line) => (
              <View key={line} style={s.item}>
                <View style={s.bullet} />
                <Text style={s.itemText}>{line}</Text>
              </View>
            ))}
          </View>
          <Text style={s.note}>This can't be undone.</Text>

          <TouchableOpacity style={[s.confirm, loading && s.disabled]} onPress={onConfirm} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.dangerTone.text} />
            ) : (
              <Text style={s.confirmText}>Confirm cancellation</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.keep} onPress={onClose} disabled={loading}>
            <Text style={s.keepText}>Keep my place</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    scrim: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.hero,
      borderTopRightRadius: t.radius.hero,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.xl,
      paddingBottom: t.spacing.xxl,
      gap: t.spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.borderStrong,
      marginBottom: t.spacing.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    title: { ...t.typography.h2, color: t.colors.textPrimary },
    list: { gap: t.spacing.sm },
    item: { flexDirection: 'row', gap: t.spacing.sm, alignItems: 'flex-start' },
    bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.colors.textMuted, marginTop: 8 },
    itemText: { ...t.typography.body, color: t.colors.textBody, flex: 1 },
    note: { ...t.typography.caption, color: t.colors.textMuted },
    confirm: {
      marginTop: t.spacing.sm,
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.dangerTone.bg,
      borderWidth: 1,
      borderColor: t.colors.dangerTone.border,
    },
    confirmText: { ...t.typography.button, color: t.colors.dangerTone.text },
    disabled: { opacity: 0.6 },
    keep: { alignItems: 'center', paddingVertical: t.spacing.md },
    keepText: { ...t.typography.button, color: t.colors.textBody },
  })
