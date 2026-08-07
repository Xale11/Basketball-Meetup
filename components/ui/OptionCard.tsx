import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export interface OptionCardItem<T = string> {
  label: string;
  description: string;
  value: T;
  icon: LucideIcon;
}

interface OptionCardListProps<T = string> {
  options: OptionCardItem<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

const { colors, radius, typography } = theme;

export function OptionCardList<T>({ options, selected, onSelect }: OptionCardListProps<T>) {
  return (
    <View style={styles.list}>
      {options.map(({ label, description, value, icon: Icon }) => {
        const active = value === selected;
        return (
          <TouchableOpacity
            key={String(value)}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onSelect(value)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconWrapper, active && styles.iconWrapperActive]}>
              <Icon size={20} color={active ? colors.textOnAccent : colors.textMuted} />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[typography.bodyStrong, styles.label, active && styles.labelActive]}>
                {label}
              </Text>
              <Text style={[typography.caption, styles.description]}>{description}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.chip,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTone.bg,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.accent,
  },
  textWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  labelActive: {
    color: colors.accentText,
  },
  description: {
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
