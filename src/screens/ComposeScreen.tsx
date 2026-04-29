import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useSignaturesStore } from '../store';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';
import { EmailBodyView } from '../components/EmailBodyView';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function buildHtmlEmail(plainText: string, signatureHtml: string): string {
  // Convert plain text body to safe HTML paragraphs
  const bodyHtml = plainText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => (line.trim() ? `<p style="margin:0 0 8px 0;line-height:1.6">${line}</p>` : '<br>'))
    .join('');

  const sig = signatureHtml
    ? `<hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0">${signatureHtml}`
    : '';

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#1E293B;margin:0;padding:16px">${bodyHtml}${sig}</body></html>`;
}

export function ComposeScreen({ route, navigation }: any) {
  const { activeAccountId, accounts } = useAccountsStore();
  const { signatures } = useSignaturesStore();

  const replyTo = route?.params?.replyTo;
  const forward = route?.params?.forward;

  const [to, setTo] = useState(replyTo ? replyTo.from.address : '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject}` : forward ? `Fwd: ${forward.subject}` : ''
  );
  const [body, setBody] = useState(
    forward
      ? `\n\n---------- Forwarded message ----------\nFrom: ${forward.from.name || forward.from.address}\n\n${forward.body}`
      : ''
  );
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const signature = activeAccountId ? signatures[activeAccountId] : null;

  const splitEmails = (str: string) =>
    str.split(',').map((e) => e.trim()).filter(Boolean);

  const handleSend = async () => {
    if (!to.trim()) { setError('Please add at least one recipient.'); return; }
    if (!activeAccountId) { setError('No active account selected.'); return; }

    setIsSending(true);
    setError('');

    try {
      const sigHtml = signature?.html || '';
      const sigText = sigHtml
        ? stripHtml(sigHtml)
        : '';

      // Plain-text version (shown in clients that don't support HTML)
      const plainBody = sigText
        ? `${body}\n\n-- \n${sigText}`
        : body;

      // HTML version — body is plain text converted to HTML paragraphs + rendered signature
      const htmlBody = buildHtmlEmail(body, sigHtml);

      const res = await fetch(`${API_URL}/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: activeAccountId,
          to: splitEmails(to),
          cc: splitEmails(cc),
          bcc: splitEmails(bcc),
          subject,
          body: plainBody,
          bodyHtml: htmlBody,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <TouchableOpacity
          style={[styles.sendBtn, (!to.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!to.trim() || isSending}
        >
          <Text style={styles.sendBtnText}>{isSending ? 'Sending…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.fromValue}>{activeAccount?.email || 'No account'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>To</Text>
            <TextInput
              style={styles.input}
              value={to}
              onChangeText={setTo}
              placeholder="Recipients"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.ccToggle} onPress={() => setShowCcBcc(!showCcBcc)}>
            <Text style={styles.ccToggleText}>{showCcBcc ? 'Hide Cc/Bcc' : 'Add Cc/Bcc'}</Text>
          </TouchableOpacity>

          {showCcBcc && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Cc</Text>
                <TextInput
                  style={styles.input}
                  value={cc}
                  onChangeText={setCc}
                  placeholder="Cc"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Bcc</Text>
                <TextInput
                  style={styles.input}
                  value={bcc}
                  onChangeText={setBcc}
                  placeholder="Bcc"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={[styles.input, styles.subjectInput]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject"
              placeholderTextColor={colors.textLight}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.bodyField}>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write your message…"
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {signature?.html ? (
            <View style={styles.signaturePreview}>
              <Text style={styles.signatureLabel}>— Signature preview</Text>
              <EmailBodyView body={signature.html} autoHeight />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  headerBtn: { padding: spacing.sm },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelText: {
    fontSize: fontSize.base,
    color: colors.secondary,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  form: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    width: 52,
    fontSize: fontSize.base,
    color: colors.secondary,
    fontWeight: '500',
  },
  fromValue: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.primary,
    paddingVertical: spacing.xs,
  },
  subjectInput: { fontWeight: '600' },
  ccToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ccToggleText: {
    fontSize: fontSize.base,
    color: colors.accent,
    fontWeight: '500',
  },
  error: {
    color: colors.red,
    fontSize: fontSize.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  bodyField: {
    flex: 1,
    padding: spacing.lg,
    minHeight: 240,
  },
  bodyInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.primary,
    lineHeight: 22,
  },
  signaturePreview: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  signatureLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  signatureText: {
    fontSize: fontSize.base,
    color: colors.secondary,
  },
});
