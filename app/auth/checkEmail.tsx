import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MailCheck, RefreshCw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

export default function CheckEmailScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const [email] = useState(initialEmail || '');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenMailApp = () => {
    // For now just hint and let user go back; deep-linking into mail apps
    // is platform-specific and optional.
    router.replace('/auth/login');
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address missing. Please go back and sign up again.');
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        console.error('Resend verification error:', error.message);
        setError(error.message || 'Failed to resend verification email.');
        return;
      }

      setMessage('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      console.error('Unexpected resend error:', err?.message || err);
      setError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <MailCheck size={40} color={theme.colors.textOnAccent} />
          </View>
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a verification link to
          {email ? ` ${email}.` : ' your email address.'} Tap the link to verify
          your account before signing in.
        </Text>

        {message ? <FormAlert message={message} variant="success" style={styles.alert} /> : null}
        {error ? <FormAlert message={error} style={styles.alert} /> : null}

        <View style={styles.actions}>
          <Button label="I've verified my email" onPress={handleOpenMailApp} />
          <Button
            label="Resend verification email"
            variant="secondary"
            leftIcon={RefreshCw}
            loading={resending}
            onPress={handleResend}
          />
        </View>

        <Button
          label="Back to sign in"
          variant="ghost"
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.canvas,
    },
    content: {
      flex: 1,
      paddingHorizontal: t.spacing.xl,
      justifyContent: 'center',
    },
    iconWrapper: {
      alignItems: 'center',
      marginBottom: t.spacing.xxl,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...t.shadow.accentGlow,
    },
    title: {
      ...t.typography.h1,
      fontSize: 28,
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginBottom: t.spacing.md,
    },
    subtitle: {
      ...t.typography.body,
      fontSize: 15,
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: t.spacing.xxl,
    },
    alert: {
      marginBottom: t.spacing.lg,
    },
    actions: {
      gap: t.spacing.md,
      marginBottom: t.spacing.xl,
    },
  });
