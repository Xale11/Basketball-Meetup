import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface PillOption<T = string> {
  label: string;
  value: T;
}

interface PillSelectorProps<T = string> {
  options: PillOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

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
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  pillActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
