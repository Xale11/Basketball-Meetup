import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { theme } from '@/constants/theme';

interface SectionCardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const { colors, radius, shadow } = theme;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
});
