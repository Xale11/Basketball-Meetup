import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { appVariant } from '@/constants/appVariant';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { FormAlert } from '@/components/ui/FormAlert';
import { DismissKeyboardView } from '@/components/ui/DismissKeyboardView';

const AC_LOGO = require('@/assets/images/activCampus/logo.png');
const isActivCampus = appVariant === 'activCampus';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loading, signInWithEmail } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await signInWithEmail(email, password);
      // No navigation here — the route guard in app/_layout.tsx swaps to the app
      // as soon as the session lands.
    } catch (err) {
      setError('Invalid email or password');
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
        <DismissKeyboardView style={styles.content}>
          <View style={styles.header}>
            {isActivCampus ? (
              // The full wordmark lockup — this is the first screen a user sees,
              // so it carries the brand rather than a bare mark.
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {isActivCampus
                ? 'Sign in to find what’s happening on campus'
                : 'Sign in to find courts and connect with players'}
            </Text>
          </View>

          <View style={styles.form}>
            {error ? <FormAlert message={error} style={styles.alert} /> : null}

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
              autoComplete="password"
              style={styles.inputSpacing}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                </TouchableOpacity>
              }
            />

            <Button label="Sign In" onPress={handleLogin} style={styles.loginButton} />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
  },
  // The artwork is a square lockup with its own internal padding, so it needs
  // no circular chip behind it the way the emoji does.
  brandLogo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  alert: {
    marginBottom: 24,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signUpText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});