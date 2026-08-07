import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export interface PillOption<T = string> {
  label: string;
  value: T;
}

interface PillSelectorProps<T = string> {
  options: PillOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

const { colors, radius, typography } = theme;

export function PillSelector<T>({ options, selected, onSelect }: PillSelectorProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[typography.label, styles.pillText, active && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accentTone.bg,
    borderColor: colors.accentTone.border,
  },
  pillText: {
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.accentTone.text,
  },
});
