import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  style?: ViewStyle;
}

const { colors, radius, shadow, typography, gradient } = theme;

/**
 * `primary` fills with the theme gradient rather than a flat colour — that is
 * the redesign's signature CTA. Every other variant is a flat surface.
 */
const VARIANT_STYLES: Record<
  ButtonVariant,
  { button: ViewStyle; textColor: string; spinnerColor: string }
> = {
  primary: {
    // Solid fill matching the gradient's first stop: iOS needs an opaque
    // backing to cast a shadow from, and the gradient covers it visually.
    button: { backgroundColor: gradient.primary[0], ...shadow.accentGlow },
    textColor: colors.textOnAccent,
    spinnerColor: colors.textOnAccent,
  },
  secondary: {
    button: {
      backgroundColor: colors.accentTone.bg,
      borderWidth: 1,
      borderColor: colors.accentTone.border,
    },
    textColor: colors.accentTone.text,
    spinnerColor: colors.accentTone.text,
  },
  destructive: {
    button: {
      backgroundColor: colors.dangerTone.bg,
      borderWidth: 1,
      borderColor: colors.dangerTone.border,
    },
    textColor: colors.dangerTone.text,
    spinnerColor: colors.dangerTone.text,
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    textColor: colors.textMuted,
    spinnerColor: colors.textMuted,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  style,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];

  return (
    <TouchableOpacity
      style={[styles.base, v.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.card }]}
        />
      )}

      {loading ? (
        <ActivityIndicator color={v.spinnerColor} />
      ) : (
        <View style={styles.inner}>
          {LeftIcon && <LeftIcon size={18} color={v.textColor} style={styles.leftIcon} />}
          <Text
            style={[
              typography.button,
              { color: v.textColor },
              variant === 'ghost' && styles.ghostLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // Deliberately no `overflow: 'hidden'` — on iOS it sets masksToBounds,
    // which clips the view's own shadow. The gradient is clipped by matching
    // its borderRadius to the container's instead.
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  ghostLabel: {
    textDecorationLine: 'underline',
  },
});
