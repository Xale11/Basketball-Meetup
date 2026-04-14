import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  sublabel?: string;
  style?: ViewStyle;
}

export function ToggleRow({ label, value, onValueChange, sublabel, style }: ToggleRowProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.labelGroup}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  sublabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
