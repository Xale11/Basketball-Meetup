import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { appVariant } from '@/constants/appVariant';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { FormAlert } from '@/components/ui/FormAlert';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

const AC_LOGO = require('@/assets/images/activCampus/logo.png');
const isActivCampus = appVariant === 'activCampus';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { loading, signUpWithEmail } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const session = await signUpWithEmail(email, password, name);

      // A session means the account is active — the route guard in
      // app/_layout.tsx takes over from here. No session means Supabase is
      // waiting on email confirmation.
      if (!session) {
        router.replace('/auth/checkEmail');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              {isActivCampus ? (
                <Image
                  source={AC_LOGO}
                  resizeMode="contain"
                  style={styles.brandLogo}
                  accessibilityRole="image"
                  accessibilityLabel="Active Campus"
                />
              ) : (
                <View style={styles.logo}>
                  <Text style={styles.logoText}>🏀</Text>
                </View>
              )}
              <Text style={styles.title}>
                {isActivCampus ? 'Join your campus' : 'Join the Game'}
              </Text>
              <Text style={styles.subtitle}>
                {isActivCampus
                  ? 'Create your account to see what’s on'
                  : 'Create your account to start playing'}
              </Text>
            </View>

            <View style={styles.form}>
              {error ? <FormAlert message={error} style={styles.alert} /> : null}

              <TextInputField
                icon={User}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                style={styles.inputSpacing}
              />

              <TextInputField
                icon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.inputSpacing}
              />

              <TextInputField
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={styles.inputSpacing}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color={theme.colors.textMuted} /> : <Eye size={20} color={theme.colors.textMuted} />}
                  </TouchableOpacity>
                }
              />

              <TextInputField
                icon={Lock}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                style={styles.inputSpacing}
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    {showConfirmPassword ? <EyeOff size={20} color={theme.colors.textMuted} /> : <Eye size={20} color={theme.colors.textMuted} />}
                  </TouchableOpacity>
                }
              />

              <Button label="Create Account" onPress={handleRegister} style={styles.registerButton} />

              <View style={styles.terms}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.linkText}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.canvas,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: t.spacing.xl,
      justifyContent: 'center',
      paddingVertical: t.spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: t.spacing.xxl,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: t.spacing.xl,
    },
    logoText: {
      fontSize: 32,
    },
    // Smaller than the login screen's: this form is taller, so the lockup
    // gives up height to keep the fields above the fold.
    brandLogo: {
      width: 120,
      height: 120,
      marginBottom: t.spacing.xs,
    },
    title: {
      ...t.typography.h1,
      fontSize: 28,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.sm,
    },
    subtitle: {
      ...t.typography.body,
      fontSize: 15,
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      marginBottom: t.spacing.xxl,
    },
    alert: {
      marginBottom: t.spacing.xl,
    },
    inputSpacing: {
      marginBottom: t.spacing.lg,
    },
    eyeIcon: {
      padding: 4,
    },
    registerButton: {
      marginTop: t.spacing.sm,
    },
    terms: {
      marginTop: t.spacing.xl,
      paddingHorizontal: t.spacing.sm,
    },
    termsText: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    linkText: {
      color: t.colors.accentText,
      fontFamily: t.typography.label.fontFamily,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      ...t.typography.body,
      color: t.colors.textMuted,
    },
    signInText: {
      ...t.typography.label,
      color: t.colors.accentText,
    },
  });