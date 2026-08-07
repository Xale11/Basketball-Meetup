import { useEffect } from 'react';
import { Stack } from 'expo-router';
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

  // Only two conditions may replace the whole tree, and both are one-shot:
  // fonts loading, and the cold-start session/profile resolve. Neither flips
  // back to true later, so background refetches can no longer unmount the app.
  if (!fontsLoaded || initialising) {
    return <LoadingSpinner />;
  }
  if (session && !profileLoaded) {
    return <LoadingSpinner />;
  }

  const signedIn = !!session;

  // Route protection is declarative: expo-router keeps unavailable groups out of
  // the navigation state and falls back to the first available screen. There are
  // no imperative router calls here — mixing the two is what produced the random
  // redirects (an effect keyed on `user` re-ran on every profile refetch).
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn && !needsOnboarding}>
          <Stack.Screen name="(tabs)" />
          {/* Create was an empty-titled tab; it is now a dismissible modal
              pushed by the tab bar's floating (+). */}
          <Stack.Screen name="create" options={{ presentation: 'modal' }} />
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
