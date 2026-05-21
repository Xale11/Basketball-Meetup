import { View, Text, StyleSheet } from 'react-native';
import { Button, ButtonVariant } from './Button';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  leftIcon?: LucideIcon;
}

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {(primaryAction || secondaryAction) && (
        <View style={styles.actions}>
          {primaryAction && (
            <Button
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant ?? 'primary'}
              leftIcon={primaryAction.leftIcon}
              style={styles.actionButton}
            />
          )}
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant ?? 'secondary'}
              leftIcon={secondaryAction.leftIcon}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
  },
});
