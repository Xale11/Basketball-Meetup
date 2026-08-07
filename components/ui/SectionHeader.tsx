import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme, ToneTokens } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  /** Renders as a tinted pill (Happening Now, Starting Soon). Plain text when omitted. */
  tone?: ToneTokens;
  icon?: LucideIcon;
  /** Right-aligned hint, e.g. "Sorted by start time" or a result count. */
  trailing?: string;
  style?: ViewStyle;
}

const { colors, radius, typography } = theme;

/** Feed section heading — a tinted badge-style header or a plain micro-label. */
export function SectionHeader({ title, tone, icon: Icon, trailing, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      {tone ? (
        <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          {Icon && <Icon size={14} color={tone.solid} />}
          <Text style={[typography.microLabel, { color: tone.text }]}>{title}</Text>
        </View>
      ) : (
        <View style={styles.plain}>
          {Icon && <Icon size={14} color={colors.accentHi} />}
          <Text style={typography.microLabel}>{title}</Text>
        </View>
      )}

      {trailing ? <Text style={[typography.caption, styles.trailing]}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  plain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trailing: {
    color: colors.textFaint,
  },
});
