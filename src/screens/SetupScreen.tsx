import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore } from '../store';
import { detectImapSettings, validateEmail } from '../utils/imapDetect';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stratummail-api.onrender.com/api';

export function SetupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email');
  
  const { addAccount } = useAccountsStore();

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleAddAccount = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const imapSettings = detectImapSettings(email);

      const validateResponse = await fetch(`${API_URL}/account/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!validateResponse.ok) {
        const errData = await validateResponse.json();
        throw new Error(errData.error || 'Failed to validate account');
      }

      const validatedSettings = await validateResponse.json();

      const addResponse = await fetch(`${API_URL}/account/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          imapSettings: validatedSettings
        })
      });

      if (!addResponse.ok) {
        const errData = await addResponse.json();
        throw new Error(errData.error || 'Failed to add account');
      }

      const account = await addResponse.json();
      addAccount(account);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to add account. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Account Added!</Text>
          <Text style={styles.successText}>
            Your email account has been set up successfully.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Main')}
          >
            <Text style={styles.primaryButtonText}>Open Inbox</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>S</Text>
            <Text style={styles.title}>StratumMail Mzansi</Text>
            <Text style={styles.subtitle}>
              {step === 'email' 
                ? 'Enter your email address' 
                : 'Enter your password to continue'}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'email' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailSubmit}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'password' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.emailDisplay}>
                    <Text style={styles.emailText}>{email}</Text>
                    <TouchableOpacity onPress={() => setStep('email')}>
                      <Text style={styles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    placeholderTextColor={colors.textLight}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Display Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    placeholderTextColor={colors.textLight}
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAddAccount}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Add Account</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.accent,
    backgroundColor: colors.surface,
    width: 100,
    height: 100,
    textAlign: 'center',
    lineHeight: 100,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.secondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.base,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emailDisplay: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emailText: {
    fontSize: fontSize.base,
    color: colors.primary,
  },
  changeLink: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  error: {
    color: colors.red,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  successIcon: {
    fontSize: 64,
    color: colors.green,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: fontSize.base,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});