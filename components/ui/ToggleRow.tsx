import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  sublabel?: string;
  style?: ViewStyle;
}

const { colors, typography } = theme;

export function ToggleRow({ label, value, onValueChange, sublabel, style }: ToggleRowProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.labelGroup}>
        <Text style={typography.label}>{label}</Text>
        {sublabel ? <Text style={[typography.caption, styles.sublabel]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.surfaceAlt}
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
  sublabel: {
    marginTop: 2,
  },
});
