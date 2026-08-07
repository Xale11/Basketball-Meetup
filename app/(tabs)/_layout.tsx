import { Tabs } from 'expo-router';
import { tabs, appVariant } from '@/constants/appVariant';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { theme } from '@/constants/theme';

/**
 * The bar itself lives in `components/navigation/AppTabBar` — labels, icons and
 * the floating create button are all resolved there. This file only declares
 * which routes exist and which are visible for the current app variant.
 *
 * Create is deliberately NOT a tab: it is a modal route at `app/create.tsx`
 * that the bar's floating (+) pushes.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // The bar is absolutely positioned so the FAB can overflow it; give
        // screens room so their last row isn't hidden underneath.
        sceneStyle: { backgroundColor: theme.colors.canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: appVariant === 'activCampus' ? 'Discover' : 'Home',
          href: tabs.home ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', href: tabs.map ? undefined : null }}
      />
      <Tabs.Screen
        name="events"
        options={{ title: 'Events', href: tabs.events ? undefined : null }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: appVariant === 'activCampus' ? 'Societies' : 'Clubs',
          href: tabs.clubs ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="add-court"
        options={{ title: 'Add Court', href: tabs.addCourt ? undefined : null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', href: tabs.profile ? undefined : null }}
      />
    </Tabs>
  );
}
