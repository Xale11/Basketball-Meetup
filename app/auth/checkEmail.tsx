import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MailCheck, RefreshCw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/api/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CheckEmailScreen() {
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
            <MailCheck size={40} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a verification link to
          {email ? ` ${email}.` : ' your email address.'} Tap the link to verify
          your account before signing in.
        </Text>

        {message ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleOpenMailApp}
          >
            <Text style={styles.primaryButtonText}>I&apos;ve verified my email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResend}
            disabled={resending}
          >
            {resending ? (
              <LoadingSpinner />
            ) : (
              <>
                <RefreshCw size={18} color="#FF6B35" style={styles.resendIcon} />
                <Text style={styles.secondaryButtonText}>Resend verification email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.backToLoginText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoContainer: {
    backgroundColor: '#ECFDF3',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  infoText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE0D1',
  },
  resendIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '500',
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#666666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
