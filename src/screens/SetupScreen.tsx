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
  Image,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore } from '../store';
import { validateEmail } from '../utils/imapDetect';
import { shadows, spacing, fontSize, borderRadius } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Brand gradient — matches logo colours
const GRADIENT: [string, string, string] = ['#7C3AED', '#3B82F6', '#06B6D4'];

export function SetupScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email');
  const [showPassword, setShowPassword] = useState(false);

  const { addAccount } = useAccountsStore();

  const handleEmailSubmit = () => {
    if (!email) { setError('Please enter your email address'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    setStep('password');
  };

  const handleAddAccount = async () => {
    if (!password) { setError('Please enter your password'); return; }
    setIsLoading(true);
    setError('');
    try {
      const validateRes = await fetch(`${API_URL}/account/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!validateRes.ok) {
        const e = await validateRes.json();
        throw new Error(e.error || 'Failed to validate account');
      }
      const imapSettings = await validateRes.json();

      const addRes = await fetch(`${API_URL}/account/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: displayName || email.split('@')[0], imapSettings }),
      });
      if (!addRes.ok) {
        const e = await addRes.json();
        throw new Error(e.error || 'Failed to add account');
      }
      const account = await addRes.json();
      addAccount(account);
      // addAccount sets activeAccountId to the new account, clearing __setup__ sentinel
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to add account. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <LinearGradient colors={GRADIENT} style={{ flex: 1 }}>
        <SafeAreaView style={s.safeArea}>
          <View style={[s.successContainer, isWide && s.centeredContainer]}>
            <View style={s.successCard}>
              <View style={s.successIconWrap}>
                <Text style={s.successIcon}>✓</Text>
              </View>
              <Text style={s.successTitle}>You're all set!</Text>
              <Text style={s.successSub}>
                {email} has been connected successfully.
              </Text>
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => navigation.replace('Main')}
              >
                <Text style={s.primaryBtnText}>Open Inbox →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Setup form ────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[s.scroll, isWide && s.scrollWide]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero logo ── */}
            <View style={s.heroWrap}>
              <Image
                source={require('../../assets/splash-icon.png')}
                style={[s.heroLogo, isWide && s.heroLogoWide]}
                resizeMode="contain"
              />
            </View>

            {/* ── Form card ── */}
            <View style={[s.card, isWide && s.cardWide]}>
              <Text style={s.cardTitle}>
                {step === 'email' ? 'Sign in to your email' : 'Enter your password'}
              </Text>
              <Text style={s.cardSub}>
                {step === 'email'
                  ? 'Connect any IMAP / SMTP email account'
                  : `Connecting to ${email}`}
              </Text>

              {/* Email field (always visible) */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email address</Text>
                <View style={[s.inputRow, step === 'password' && s.inputRowLocked]}>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(99,102,241,0.45)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={step === 'email'}
                  />
                  {step === 'password' && (
                    <TouchableOpacity onPress={() => { setStep('email'); setError(''); }} style={s.changeBtn}>
                      <Text style={s.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Password + display name (step 2) */}
              {step === 'password' && (
                <>
                  <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Password</Text>
                    <View style={s.inputRow}>
                      <TextInput
                        style={s.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Your email password"
                        placeholderTextColor="rgba(99,102,241,0.45)"
                        secureTextEntry={!showPassword}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((v) => !v)}
                        style={s.eyeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Display name <Text style={s.optional}>(optional)</Text></Text>
                    <TextInput
                      style={s.input}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder={email.split('@')[0]}
                      placeholderTextColor="rgba(99,102,241,0.45)"
                    />
                  </View>
                </>
              )}

              {error ? (
                <View style={s.errorRow}>
                  <Text style={s.errorIcon}>⚠</Text>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.primaryBtn, isLoading && s.primaryBtnDisabled]}
                onPress={step === 'email' ? handleEmailSubmit : handleAddAccount}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.primaryBtnText}>
                    {step === 'email' ? 'Continue →' : 'Connect Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={s.footNote}>
                Your credentials are stored locally and never shared.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  scrollWide: {
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },

  // Hero
  heroWrap: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  heroLogo: { width: 160, height: 160 },
  heroLogoWide: { width: 180, height: 180 },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.floating,
  },
  cardWide: { maxWidth: 460, alignSelf: 'center' },
  cardTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontSize: fontSize.base,
    color: '#64748B',
    marginBottom: spacing.xl,
  },

  // Fields
  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#475569',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  optional: { fontWeight: '400', color: '#94A3B8' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: spacing.lg,
  },
  inputRowLocked: {
    backgroundColor: '#F8FAFF',
    borderColor: 'rgba(99,102,241,0.1)',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: fontSize.base,
    color: '#1E1B4B',
  },
  changeBtn: { paddingLeft: spacing.md },
  changeBtnText: { fontSize: fontSize.sm, color: '#6366F1', fontWeight: '600' },
  eyeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  eyeIcon: { fontSize: 18 },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: { fontSize: 14, marginRight: spacing.sm, color: '#EF4444' },
  errorText: { flex: 1, fontSize: fontSize.sm, color: '#DC2626' },

  // Primary button
  primaryBtn: {
    backgroundColor: '#6366F1',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.3 },

  footNote: {
    fontSize: fontSize.xs,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },

  // Success
  centeredContainer: { justifyContent: 'center' },
  successContainer: { flex: 1, justifyContent: 'center', padding: spacing.xl, alignItems: 'center' },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.floating,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: { fontSize: 32, color: '#FFFFFF', fontWeight: '900' },
  successTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: '#1E1B4B', marginBottom: spacing.sm },
  successSub: { fontSize: fontSize.base, color: '#64748B', textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
});
