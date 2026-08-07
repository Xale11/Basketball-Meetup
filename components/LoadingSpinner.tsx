import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  padding?: number;
}

export function LoadingSpinner({
  size = 'large',
  color = theme.colors.accent,
  padding = 0,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, padding ? { padding } : null]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.canvas,
  },
});
