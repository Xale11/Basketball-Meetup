import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme, ToneTokens } from '@/constants/theme';

export interface BadgeProps {
  label: string;
  /** A tone triplet from the theme, e.g. `colors.successTone`. */
  tone: ToneTokens;
  icon?: LucideIcon;
  /** `solid` fills with the tone's saturated colour — used for cost badges over images. */
  variant?: 'tinted' | 'solid';
  style?: ViewStyle;
}

const { colors, radius, typography } = theme;

/**
 * The tinted pill used throughout the redesign: dark tone background, matching
 * border, uppercase micro-text, optional leading icon.
 */
export function Badge({ label, tone, icon: Icon, variant = 'tinted', style }: BadgeProps) {
  const isSolid = variant === 'solid';
  const textColor = isSolid ? colors.textOnAccent : tone.text;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isSolid ? tone.solid : tone.bg,
          borderColor: isSolid ? tone.solid : tone.border,
        },
        style,
      ]}
    >
      {Icon && <Icon size={11} color={isSolid ? textColor : tone.solid} />}
      <Text style={[typography.badge, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
