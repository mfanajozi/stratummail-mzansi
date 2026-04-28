import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useSignaturesStore } from '../store';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export function SettingsScreen({ navigation }: any) {
  const { accounts, activeAccountId, setActiveAccount, removeAccount, setDefaultAccount } = useAccountsStore();
  const { signatures, setSignature } = useSignaturesStore();
  const [editingSignature, setEditingSignature] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const currentSignature = activeAccountId ? signatures[activeAccountId] : null;

  const handleSaveSignature = () => {
    if (activeAccountId && signatureText) {
      setSignature(activeAccountId, {
        id: activeAccountId,
        accountId: activeAccountId,
        html: signatureText,
        isDefault: true,
      });
    }
    setEditingSignature(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountItem,
                activeAccountId === account.id && styles.accountItemActive,
              ]}
              onPress={() => setActiveAccount(account.id)}
            >
              <View style={styles.accountInfo}>
                <Text style={styles.accountEmail}>{account.email}</Text>
                <Text style={styles.accountName}>{account.displayName}</Text>
              </View>
              {account.isDefault && (
                <Text style={styles.defaultBadge}>Default</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => navigation.navigate('Setup')}
          >
            <Text style={styles.addAccountIcon}>+</Text>
            <Text style={styles.addAccountText}>Add Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          
          {activeAccount ? (
            <>
              {editingSignature ? (
                <View style={styles.signatureEditor}>
                  <TextInput
                    style={styles.signatureInput}
                    value={signatureText}
                    onChangeText={setSignatureText}
                    placeholder="Enter your signature..."
                    placeholderTextColor={colors.textLight}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.signatureActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setEditingSignature(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveSignature}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.signaturePreview}
                  onPress={() => {
                    setSignatureText(currentSignature?.html || '');
                    setEditingSignature(true);
                  }}
                >
                  {currentSignature ? (
                    <Text style={styles.signatureHtml}>{currentSignature.html}</Text>
                  ) : (
                    <Text style={styles.noSignature}>
                      Tap to add a signature
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noAccountText}>
              Add an account to set up a signature
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Notifications</Text>
            <Text style={styles.preferenceValue}>On</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Dark Mode</Text>
            <Text style={styles.preferenceValue}>Off</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Sync Frequency</Text>
            <Text style={styles.preferenceValue}>15 minutes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>StratumMail Mzansi</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  accountItemActive: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.primary,
  },
  accountName: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    marginTop: 2,
  },
  defaultBadge: {
    fontSize: fontSize.xs,
    color: colors.accent,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  addAccountIcon: {
    fontSize: 20,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  addAccountText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.accent,
  },
  signatureEditor: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  signatureInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.secondary,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.surface,
  },
  signaturePreview: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: 80,
  },
  signatureHtml: {
    fontSize: fontSize.base,
    color: colors.primary,
  },
  noSignature: {
    fontSize: fontSize.base,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  noAccountText: {
    fontSize: fontSize.md,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  preferenceLabel: {
    fontSize: fontSize.base,
    color: colors.primary,
  },
  preferenceValue: {
    fontSize: fontSize.md,
    color: colors.secondary,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  aboutLabel: {
    fontSize: fontSize.base,
    color: colors.primary,
  },
  aboutValue: {
    fontSize: fontSize.md,
    color: colors.secondary,
  },
});