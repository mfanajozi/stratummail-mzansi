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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useSignaturesStore, useUIStore } from '../store';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export function ComposeScreen({ route, navigation }: any) {
  const { activeAccountId, accounts } = useAccountsStore();
  const { signatures } = useSignaturesStore();
  const { setComposeModalVisible } = useUIStore();
  
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const signature = activeAccountId ? signatures[activeAccountId] : null;

  const handleSend = async () => {
    if (!to) {
      return;
    }

    setIsSending(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.sendButton]}
          onPress={handleSend}
          disabled={isSending || !to}
        >
          <Text style={[styles.sendText, (!to || isSending) && styles.sendTextDisabled]}>
            {isSending ? 'Sending...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>From</Text>
            <Text style={styles.fromValue}>
              {activeAccount?.email || 'No account selected'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>To</Text>
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

          <View style={styles.field}>
            <TouchableOpacity onPress={() => setShowCcBcc(!showCcBcc)}>
              <Text style={styles.ccLink}>
                {showCcBcc ? 'Hide Cc/Bcc' : 'Add Cc/Bcc'}
              </Text>
            </TouchableOpacity>
          </View>

          {showCcBcc && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Cc</Text>
                <TextInput
                  style={styles.input}
                  value={cc}
                  onChangeText={setCc}
                  placeholder="Cc recipients"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Bcc</Text>
                <TextInput
                  style={styles.input}
                  value={bcc}
                  onChangeText={setBcc}
                  placeholder="Bcc recipients"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={[styles.input, styles.subjectInput]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.bodyField}>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write your message..."
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {signature && (
            <View style={styles.signaturePreview}>
              <Text style={styles.signatureLabel}>Signature</Text>
              <Text style={styles.signatureText}>{signature.html}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarButton}>
            <Text style={styles.toolbarIcon}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Text style={styles.toolbarIcon}>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Text style={styles.toolbarIcon}>📎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Text style={styles.toolbarIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Text style={styles.toolbarIcon}>≡</Text>
          </TouchableOpacity>
        </View>
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
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelText: {
    fontSize: fontSize.md,
    color: colors.secondary,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sendText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.surface,
  },
  sendTextDisabled: {
    opacity: 0.5,
  },
  keyboardView: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldLabel: {
    width: 50,
    fontSize: fontSize.md,
    color: colors.secondary,
  },
  fromValue: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.primary,
    padding: spacing.sm,
  },
  subjectInput: {
    fontWeight: '500',
  },
  ccLink: {
    fontSize: fontSize.md,
    color: colors.accent,
  },
  bodyField: {
    flex: 1,
    padding: spacing.lg,
  },
  bodyInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.primary,
    minHeight: 200,
  },
  signaturePreview: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
  },
  signatureLabel: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  signatureText: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  toolbarButton: {
    padding: spacing.sm,
  },
  toolbarIcon: {
    fontSize: 20,
    color: colors.secondary,
  },
});