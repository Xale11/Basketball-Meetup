import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/**
 * First screen of the onboarding group, shown straight after sign-up.
 *
 * NOTE: email confirmation is not enabled on the Supabase project, so no
 * verification email is actually sent and nothing here is enforced — this is a
 * placeholder for that step. The copy deliberately does not claim a mail was
 * sent, because it wasn't. Once confirmation is switched on, gate `Continue`
 * on `session.user.email_confirmed_at` and move the honest-placeholder note.
 */
export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { session } = useAuth();

  const email = session?.user?.email;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.iconCircle}>
          <MailCheck size={38} color={theme.colors.textOnAccent} />
        </View>

        <Text style={s.title}>Verify your email</Text>
        <Text style={s.subtitle}>
          {email
            ? `Your account is registered to ${email}.`
            : 'Your account has been created.'}
        </Text>

        <View style={s.notice}>
          <Text style={s.noticeText}>
            Email verification isn&apos;t switched on yet, so there&apos;s nothing to confirm
            right now. Continue to set up your profile.
          </Text>
        </View>

        <Button
          label="Continue"
          onPress={() => router.push('/onboarding/profile')}
          style={s.action}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    content: {
      flex: 1,
      paddingHorizontal: t.spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
      marginBottom: t.spacing.xl,
      ...t.shadow.accentGlow,
    },
    title: {
      ...t.typography.h1,
      fontSize: 26,
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginBottom: t.spacing.sm,
    },
    subtitle: {
      ...t.typography.body,
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 21,
    },
    notice: {
      marginTop: t.spacing.xl,
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    noticeText: {
      ...t.typography.caption,
      color: t.colors.textBody,
      textAlign: 'center',
      lineHeight: 18,
    },
    action: {
      marginTop: t.spacing.xl,
      alignSelf: 'stretch',
    },
  });
