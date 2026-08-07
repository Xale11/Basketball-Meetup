import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

export interface StackedAvatar {
  id: string;
  name?: string | null;
  photoUrl?: string | null;
}

interface AvatarStackProps {
  avatars: StackedAvatar[];
  size?: number;
  /** Beyond this, the remainder collapses into a "+n" chip. */
  max?: number;
  style?: ViewStyle;
}

const { colors, typography } = theme;

/** Overlapping avatar row — "friends attending" on activity cards. */
export function AvatarStack({ avatars, size = 22, max = 5, style }: AvatarStackProps) {
  if (avatars.length === 0) return null;

  const shown = avatars.slice(0, max);
  const overflow = avatars.length - shown.length;
  const ring = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.row, style]}>
      {shown.map((avatar, index) => (
        <View
          key={avatar.id}
          style={[styles.slot, ring, index > 0 && { marginLeft: -size / 3.5 }]}
        >
          {avatar.photoUrl ? (
            <Image source={{ uri: avatar.photoUrl }} style={ring} />
          ) : (
            <View style={[styles.fallback, ring]}>
              <Text style={[typography.badge, styles.initial]}>
                {(avatar.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}

      {overflow > 0 && (
        <View style={[styles.slot, styles.overflow, ring, { marginLeft: -size / 3.5 }]}>
          <Text style={[typography.badge, styles.initial]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  overflow: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accentTone.bg,
  },
  initial: {
    color: colors.textBody,
    fontSize: 9,
  },
});
