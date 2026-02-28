import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { auth } from '@/api/firebase';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading, session } = useAuth();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (!loading && fontsLoaded) {
      const isUserAuthenticated = async () => {
        const isAuth = session
        if (isAuth) {
          console.log(auth.currentUser);
          router.push('/(tabs)');
        } else {
          console.log('User is not authenticated');
          router.replace('/auth/login');
        }
      };
      isUserAuthenticated();
    }
  }, [user, loading, fontsLoaded]);

  const queryClient = new QueryClient();

  if (!fontsLoaded) {
    return (
      <>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LoadingSpinner />
          </AuthProvider>
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
