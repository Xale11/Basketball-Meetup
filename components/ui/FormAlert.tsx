import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface FormAlertProps {
  message: string;
  variant?: 'error' | 'success';
  style?: ViewStyle;
}

const { colors, radius, typography } = theme;

export function FormAlert({ message, variant = 'error', style }: FormAlertProps) {
  const tone = variant === 'success' ? colors.successTone : colors.dangerTone;

  return (
    <View
      style={[styles.container, { backgroundColor: tone.bg, borderColor: tone.border }, style]}
    >
      <Text style={[typography.body, styles.text, { color: tone.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.chip,
    padding: 16,
    borderWidth: 1,
  },
  text: {
    textAlign: 'center',
  },
});
