import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface FormAlertProps {
  message: string;
  variant?: 'error' | 'success';
  style?: ViewStyle;
}

export function FormAlert({ message, variant = 'error', style }: FormAlertProps) {
  return (
    <View style={[styles.container, variant === 'success' ? styles.success : styles.error, style]}>
      <Text style={[styles.text, variant === 'success' ? styles.successText : styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  success: {
    backgroundColor: '#ECFDF3',
    borderColor: '#BBF7D0',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
  },
  successText: {
    color: '#166534',
  },
});
