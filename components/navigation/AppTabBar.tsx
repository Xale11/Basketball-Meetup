import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Compass,
  Chrome as Home,
  Map,
  Calendar,
  Users,
  User,
  Plus,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { appVariant, tabs } from '@/constants/appVariant';
import { usePendingRequests } from '@/hooks/friends/usePendingRequests';
import { useReceivedEventInvites } from '@/hooks/events/useReceivedEventInvites';

const { colors, radius, spacing, shadow, gradient, typography } = theme;

/** Height of the bar itself, before the safe-area inset is added. */
const BAR_HEIGHT = 60;
/** The floating create button. Overflows the top edge of the bar. */
const FAB_SIZE = 56;
/** Canvas-coloured ring that separates the FAB from the bar behind it. */
const FAB_RING = 4;

type IconName = 'discover' | 'map' | 'events' | 'societies' | 'addCourt' | 'profile';

const ICONS: Record<IconName, typeof Map> = {
  // ActivCampus calls Home "Discover" and uses a compass; BM keeps a house.
  discover: appVariant === 'activCampus' ? Compass : Home,
  map: Map,
  events: Calendar,
  societies: Users,
  addCourt: Plus,
  profile: User,
};

/**
 * Route name -> label, icon, and the `tabs` visibility flag that governs it.
 *
 * The flag has to be checked here. `href: null` only tells expo-router's own
 * bar to skip a screen — the route is still present in `state.routes`, so a
 * custom bar that renders everything it is handed shows tabs that are supposed
 * to be hidden (ActivCampus was getting Events and Add Court).
 */
const ROUTE_META: Record<
  string,
  { label: string; icon: IconName; visible: keyof typeof tabs }
> = {
  index: {
    label: appVariant === 'activCampus' ? 'Discover' : 'Home',
    icon: 'discover',
    visible: 'home',
  },
  map: { label: 'Map', icon: 'map', visible: 'map' },
  events: { label: 'Events', icon: 'events', visible: 'events' },
  clubs: {
    label: appVariant === 'activCampus' ? 'Societies' : 'Clubs',
    icon: 'societies',
    visible: 'clubs',
  },
  // Basketball Meetup only.
  'add-court': { label: 'Add Court', icon: 'addCourt', visible: 'addCourt' },
  profile: { label: 'Profile', icon: 'profile', visible: 'profile' },
};

/** Unread count shown on the Profile tab: friend requests + event invites. */
function useUnreadCount() {
  const { count: friendRequestCount } = usePendingRequests();
  const { count: eventInviteCount } = useReceivedEventInvites();
  return friendRequestCount + eventInviteCount;
}

function TabItem({
  label,
  icon: Icon,
  focused,
  badgeCount,
  onPress,
  onLongPress,
}: {
  label: string;
  icon: typeof Map;
  focused: boolean;
  badgeCount?: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const tint = focused ? colors.accentHi : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      hitSlop={8}
    >
      <View>
        <Icon size={22} color={tint} strokeWidth={focused ? 2.5 : 2} />
        {!!badgeCount && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Custom bottom tab bar.
 *
 * Replaces the default bar so the create action can be a circle that floats
 * *above* the bar's top edge — that overflow is impossible with `tabBarIcon`
 * alone, which is clipped to its slot.
 *
 * The create button is not a tab route: it pushes the `/create` modal, so the
 * bar renders (n) real tabs plus one action. For ActivCampus that gives
 * Discover · Map · (+) · Societies · Profile.
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadCount();

  const items = state.routes
    .map((route, index) => ({ route, index, meta: ROUTE_META[route.name] }))
    .filter((item) => item.meta && tabs[item.meta.visible]);

  const showCreate = appVariant === 'activCampus';
  // Split the tabs either side of the floating button.
  const splitAt = showCreate ? Math.ceil(items.length / 2) : items.length;
  const leftItems = items.slice(0, splitAt);
  const rightItems = items.slice(splitAt);

  const renderItem = ({ route, index, meta }: (typeof items)[number]) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () =>
      navigation.emit({ type: 'tabLongPress', target: route.key });

    return (
      <TabItem
        key={route.key}
        label={options.title ?? meta.label}
        icon={ICONS[meta.icon]}
        focused={focused}
        badgeCount={route.name === 'profile' ? unreadCount : undefined}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      {/* Blur only reads as glass over a translucent fill; the solid layer
          underneath keeps contrast on Android, where blur is cheaper/weaker. */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 0}
        tint={theme.dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.fill} />

      <View style={styles.row}>
        <View style={styles.group}>{leftItems.map(renderItem)}</View>

        {showCreate && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create activity"
            onPress={() => router.push('/create')}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            hitSlop={8}
          >
            <LinearGradient
              colors={gradient.primary}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.fabGradient}
            >
              <Plus size={28} color={colors.textOnAccent} strokeWidth={3} />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.group}>{rightItems.map(renderItem)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Matches the header's divider — the reference navbar is border-t
    // border-teal-900/40, the same faint teal.
    borderTopWidth: 1,
    borderTopColor: colors.chromeBorder,
    // Let the FAB overflow the top edge instead of being clipped.
    overflow: 'visible',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.dark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    paddingHorizontal: spacing.sm,
  },
  group: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.chip,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  fab: {
    width: FAB_SIZE + FAB_RING * 2,
    height: FAB_SIZE + FAB_RING * 2,
    borderRadius: (FAB_SIZE + FAB_RING * 2) / 2,
    // Ring is the canvas colour so the circle reads as cut out of the bar.
    backgroundColor: colors.canvas,
    padding: FAB_RING,
    // Lift it above the bar's top edge.
    marginTop: -28,
    ...shadow.accentGlow,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
  fabGradient: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.dangerTone.solid,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...typography.badge,
    fontSize: 10,
    color: colors.textOnAccent,
  },
});
