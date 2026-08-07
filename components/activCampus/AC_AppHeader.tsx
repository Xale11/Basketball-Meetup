import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, ShieldCheck, User as UserIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useReceivedEventInvites } from '@/hooks/events/useReceivedEventInvites';
import { AC_Logo } from './AC_Logo';

const { colors, radius, spacing, shadow, typography } = theme;

interface AC_AppHeaderProps {
  /**
   * Show the "<domain> Verified" pill. The web reference hides it below its
   * `sm` breakpoint (640px) — every phone — because the row cannot fit the
   * wordmark, the pill and both controls. Off by default to match; pass true
   * on a wide layout.
   */
  showVerified?: boolean;
}

/**
 * Sticky header shared by the four ActivCampus tab screens.
 *
 * Mirrors `active-campus-ui-redesign/src/components/Header.tsx`: logo on the
 * left, then a circular bell chip and an avatar chip, both slate-800 surfaces
 * with a slate-700 hairline. The unread badge is rose; the avatar carries a
 * teal ring.
 *
 * The bell has no notification centre yet (AC-23). Until then it carries the
 * same unread count as the Profile tab — friend requests plus event invites —
 * and routes to friend requests rather than dead-ending.
 */
export function AC_AppHeader({ showVerified = false }: AC_AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const { count: friendRequestCount } = usePendingRequests();
  const { count: eventInviteCount } = useReceivedEventInvites();
  const unread = friendRequestCount + eventInviteCount;

  // The reference derives the pill from the email domain — that domain is what
  // the verification actually attests to.
  const domain = session?.user?.email?.split('@')[1] ?? 'university.ac.uk';

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.left}>
        {/* size="md" — matches the reference header. */}
        <AC_Logo size="md" />
        {showVerified && (
          <View style={styles.verifiedPill}>
            <ShieldCheck size={13} color={colors.accentTone.solid} strokeWidth={2.5} />
            <Text style={styles.verifiedText} numberOfLines={1}>
              {domain} Verified
            </Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
          }
          onPress={() => router.push('/friends/requests')}
          style={({ pressed }) => [styles.chip, styles.bellChip, pressed && styles.chipPressed]}
          hitSlop={6}
        >
          <Bell size={20} color={colors.textBody} />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/(tabs)/profile')}
          style={({ pressed }) => [styles.chip, styles.avatarChip, pressed && styles.chipPressed]}
          hitSlop={6}
        >
          {user?.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <UserIcon size={16} color={colors.textMuted} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    // slate-900. The reference is slate-900/90 with a backdrop blur, but its
    // header overlays scrolling content; ours sits in normal flow with nothing
    // behind it, so translucency would only tint it against the canvas.
    backgroundColor: colors.surface,
    // `border-b` is 1px. hairlineWidth (~0.33px at 3x) made this invisible.
    borderBottomWidth: 1,
    borderBottomColor: colors.chromeBorder,
    ...shadow.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTone.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentTone.border,
    flexShrink: 1,
  },
  verifiedText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.accentTone.text,
  },
  // Both controls are slate-800 surfaces with a slate-700 hairline.
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellChip: {
    width: 40,
    height: 40,
  },
  avatarChip: {
    padding: 4,
  },
  chipPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dangerTone.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    ...typography.badge,
    fontSize: 10,
    color: colors.textPrimary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // ring-2 ring-teal-500/60
    borderWidth: 2,
    borderColor: 'rgba(20, 184, 166, 0.6)',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceInset,
  },
});
