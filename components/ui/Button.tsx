import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

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

const VARIANT_STYLES = {
  primary: {
    button: {
      backgroundColor: '#FF6B35',
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    text: { color: '#FFFFFF' },
    spinnerColor: '#FFFFFF',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    button: {
      backgroundColor: '#FFFFFF',
    },
    text: { color: '#FF6B35' },
    spinnerColor: '#FF6B35',
    borderWidth: 1,
    borderColor: '#FFE0D1',
  },
  destructive: {
    button: {
      backgroundColor: '#FFFFFF',
    },
    text: { color: '#DC3545' },
    spinnerColor: '#DC3545',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
    },
    text: { color: '#9CA3AF', textDecorationLine: 'underline' as const },
    spinnerColor: '#9CA3AF',
    borderWidth: 0,
    borderColor: 'transparent',
  },
} as const;

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
      style={[
        styles.base,
        v.button,
        { borderWidth: v.borderWidth, borderColor: v.borderColor },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.spinnerColor} />
      ) : (
        <View style={styles.inner}>
          {LeftIcon && (
            <LeftIcon size={18} color={v.text.color} style={styles.leftIcon} />
          )}
          <Text style={[styles.label, v.text]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
