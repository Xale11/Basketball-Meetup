import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useThemedStyles, Theme } from '@/hooks/useTheme';

export default function NotFoundScreen() {
  const s = useThemedStyles(makeStyles);
  const { session, needsOnboarding } = useAuth();

  /**
   * Where "go back" can actually land.
   *
   * This used to be a hardcoded `<Link href="/">`, which is inside the
   * `signedIn && !needsOnboarding` group — so a user who landed here mid-signup
   * was offered the one route the guard had taken away, and tapping it did
   * nothing. Pick the destination the guard is currently exposing instead.
   */
  const destination = !session
    ? { label: 'Go to sign in', href: '/auth/login' as const }
    : needsOnboarding
    ? { label: 'Finish setting up your profile', href: '/onboarding' as const }
    : { label: 'Go to home', href: '/' as const };

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={s.container}>
        <Text style={s.title}>This screen doesn&apos;t exist.</Text>
        <Text style={s.subtitle}>
          The page you were looking for isn&apos;t here.
        </Text>
        <Button
          label={destination.label}
          onPress={() => router.replace(destination.href)}
          style={s.action}
        />
      </View>
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing.lg,
      backgroundColor: t.colors.canvas,
    },
    title: {
      ...t.typography.h2,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      ...t.typography.body,
      color: t.colors.textMuted,
      textAlign: 'center',
      marginTop: t.spacing.sm,
    },
    action: {
      marginTop: t.spacing.xl,
      alignSelf: 'stretch',
    },
  });
