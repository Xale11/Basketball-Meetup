import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { RotateCcw, X } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export interface FilterChip {
  id: string;
  label: string;
  /** Omit to render a non-removable chip (e.g. the always-present time scope). */
  onRemove?: () => void;
}

interface FilterChipRowProps {
  chips: FilterChip[];
  onReset?: () => void;
  /** Hides the reset affordance when nothing is actually filtered. */
  showReset?: boolean;
  style?: ViewStyle;
}

const { colors, radius, typography } = theme;

/** "Active filters:" row of removable chips with a Reset All action. */
export function FilterChipRow({ chips, onReset, showReset, style }: FilterChipRowProps) {
  if (chips.length === 0 && !showReset) return null;

  return (
    <View style={[styles.row, style]}>
      <Text style={typography.microLabel}>Active filters:</Text>

      {chips.map((chip) => (
        <View key={chip.id} style={styles.chip}>
          <Text style={[typography.badge, styles.chipLabel]} numberOfLines={1}>
            {chip.label}
          </Text>
          {chip.onRemove && (
            <TouchableOpacity
              onPress={chip.onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Remove ${chip.label} filter`}
            >
              <X size={12} color={colors.accentTone.text} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {showReset && onReset && (
        <TouchableOpacity style={styles.reset} onPress={onReset} activeOpacity={0.7}>
          <RotateCcw size={12} color={colors.dangerTone.text} />
          <Text style={[typography.badge, styles.resetLabel]}>Reset all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTone.bg,
    borderWidth: 1,
    borderColor: colors.accentTone.border,
  },
  chipLabel: {
    color: colors.accentTone.text,
    textTransform: 'none',
    flexShrink: 1,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingVertical: 4,
  },
  resetLabel: {
    color: colors.dangerTone.text,
    textTransform: 'none',
  },
});
