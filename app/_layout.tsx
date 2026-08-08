import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { theme } from '@/constants/theme';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import { queryClient } from '@/lib/queryClient';
import { setupReactQueryFocus } from '@/lib/reactQueryFocus';

function AppNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, initialising, profileLoaded, needsOnboarding } = useAuth();
  const segments = useSegments();

  const signedIn = !!session;
  const rootSegment = segments[0] as string | undefined;

  // Only two conditions may replace the whole tree, and both are one-shot:
  // fonts loading, and the cold-start session/profile resolve. Neither flips
  // back to true later, so background refetches can no longer unmount the app.
  const ready = fontsLoaded && !initialising && (!session || profileLoaded);

  /**
   * Keeps the URL inside whichever group the guards currently expose.
   *
   * The guards below remove unavailable groups, but removing a group does NOT
   * move the user off a route inside it — the URL simply stops matching and
   * `+not-found` catches it. That produced two dead ends:
   *
   *   * sign-up left the URL on `/auth/register` while the session made the
   *     `auth` group disappear;
   *   * finishing onboarding left it on `/onboarding/profile` while the new
   *     profile row made the `onboarding` group disappear.
   *
   * Both showed "This screen doesn't exist". This effect is deliberately keyed
   * only on `ready` and the three booleans that decide group membership, plus
   * the top-level segment — never on `user`/`profile`, which is what made an
   * earlier version of this re-fire on every background refetch.
   */
  useEffect(() => {
    if (!ready) return;

    const inAuth = rootSegment === 'auth';
    const inOnboarding = rootSegment === 'onboarding';

    if (!signedIn) {
      if (!inAuth) router.replace('/auth/login');
      return;
    }
    if (needsOnboarding) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    // Signed in and onboarded: auth and onboarding are both behind us.
    if (inAuth || inOnboarding) router.replace('/(tabs)');
  }, [ready, signedIn, needsOnboarding, rootSegment]);

  if (!ready) {
    return <LoadingSpinner />;
  }

  // The guards keep unavailable groups out of the navigation state; the effect
  // above keeps the *current route* inside an available one. Both are needed.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn && !needsOnboarding}>
          <Stack.Screen name="(tabs)" />
          {/* Create was an empty-titled tab; it is now a dismissible modal
              pushed by the tab bar's floating (+). */}
          <Stack.Screen name="create" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
          <Stack.Screen name="event" />
          <Stack.Screen name="user" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="club" />
          <Stack.Screen name="society" />
        </Stack.Protected>

        <Stack.Protected guard={signedIn && needsOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="auth" />
        </Stack.Protected>

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Without this, `refetchOnWindowFocus` never fires on native and nothing
  // refreshes when the app returns to the foreground.
  useEffect(() => setupReactQueryFocus(), []);

  // Family names here must match `fontFamily` in constants/theme/types.ts —
  // the typography tokens select a face by family name rather than by
  // fontWeight, which Android does not map reliably onto loaded variants.
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigator fontsLoaded={!!fontsLoaded} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
