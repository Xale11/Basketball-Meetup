import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { CalendarRange, ChevronRight } from 'lucide-react-native'
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme'

/** Profile shortcut to the court booking calendar (shown in demo mode). */
export function AC_BookingCalendarEntry({ style }: { style?: object }) {
  const { theme } = useTheme()
  const s = useThemedStyles(makeStyles)

  return (
    <TouchableOpacity
      style={[s.row, style]}
      onPress={() => router.push('/court-booking/calendar')}
      activeOpacity={0.85}
    >
      <View style={s.icon}>
        <CalendarRange size={18} color={theme.colors.accentTone.solid} />
      </View>
      <View style={s.text}>
        <Text style={s.title}>Court booking calendar</Text>
        <Text style={s.sub}>See which courts are reserved and confirmed</Text>
      </View>
      <ChevronRight size={18} color={theme.colors.textMuted} />
    </TouchableOpacity>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentTone.bg,
    },
    text: { flex: 1, gap: 2 },
    title: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    sub: { ...t.typography.caption, color: t.colors.textMuted },
  })
