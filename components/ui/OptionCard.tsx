import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

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
          >
            <View style={[styles.iconWrapper, active && styles.iconWrapperActive]}>
              <Icon size={20} color={active ? '#FFFFFF' : '#666'} />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
              <Text style={styles.description}>{description}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 12,
  },
  cardActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF4F0',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#FF6B35',
  },
  textWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  labelActive: {
    color: '#FF6B35',
  },
  description: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#FF6B35',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
});
