import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useSignaturesStore } from '../store';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { RichTextEditor } from '../components/RichTextEditor';
import { EmailBodyView } from '../components/EmailBodyView';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return {}; }
}

function SignaturePreview({ html }: { html: string }) {
  if (!html?.trim()) {
    return <Text style={s.sigPlaceholder}>Tap to add a signature</Text>;
  }
  return (
    <View style={s.sigPreviewWrap}>
      <EmailBodyView body={html} autoHeight />
    </View>
  );
}

export function SettingsScreen({ navigation }: any) {
  const { accounts, activeAccountId, setActiveAccount, removeAccount, updateDisplayName, logout } = useAccountsStore();
  const { signatures, setSignature } = useSignaturesStore();

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [editingSignature, setEditingSignature] = useState(false);
  const [signatureHtml, setSignatureHtml] = useState('');

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const currentSignature = activeAccountId ? signatures[activeAccountId] : null;

  const startEditName = (account: (typeof accounts)[0]) => {
    setEditingAccountId(account.id);
    setDraftName(account.displayName);
    setNameError('');
  };
  const cancelEditName = () => { setEditingAccountId(null); setDraftName(''); setNameError(''); };

  const saveDisplayName = async (accountId: string) => {
    if (!draftName.trim()) { setNameError('Name cannot be empty'); return; }
    setSavingName(true);
    setNameError('');
    try {
      const res = await fetch(`${API_URL}/account/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: draftName.trim() }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || `Server error (${res.status})`);
      }
      updateDisplayName(accountId, draftName.trim());
      cancelEditName();
    } catch (err: any) {
      setNameError(err.message || 'Failed to save');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveSignature = () => {
    if (activeAccountId) {
      setSignature(activeAccountId, {
        id: activeAccountId,
        accountId: activeAccountId,
        html: signatureHtml,
        isDefault: true,
      });
    }
    setEditingSignature(false);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Accounts ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Accounts</Text>

          {accounts.map((account) => {
            const isEditing = editingAccountId === account.id;
            const initials = getAvatarInitials(account.email, account.displayName);
            return (
              <View key={account.id} style={[s.card, activeAccountId === account.id && s.cardActive]}>
                <TouchableOpacity style={s.accountRow} onPress={() => { setActiveAccount(account.id); cancelEditName(); }}>
                  <Avatar initials={initials} seed={account.email} size="medium" />
                  <View style={s.accountInfo}>
                    {isEditing ? (
                      <TextInput
                        style={s.nameInput}
                        value={draftName}
                        onChangeText={setDraftName}
                        placeholder="Display name"
                        placeholderTextColor={colors.textLight}
                        autoFocus
                      />
                    ) : (
                      <Text style={s.accountName}>{account.displayName}</Text>
                    )}
                    <Text style={s.accountEmail}>{account.email}</Text>
                    {nameError && isEditing ? <Text style={s.fieldError}>{nameError}</Text> : null}
                  </View>
                  {account.isDefault && !isEditing && (
                    <View style={s.defaultBadge}><Text style={s.defaultBadgeText}>Default</Text></View>
                  )}
                </TouchableOpacity>

                <View style={s.rowActions}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity style={s.btnSec} onPress={cancelEditName} disabled={savingName}>
                        <Text style={s.btnSecText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.btnPri, savingName && { opacity: 0.6 }]} onPress={() => saveDisplayName(account.id)} disabled={savingName}>
                        {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnPriText}>Save</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={s.btnSec} onPress={() => startEditName(account)}>
                        <Text style={s.btnSecText}>Edit Name</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.btnDanger} onPress={() => removeAccount(account.id)}>
                        <Text style={s.btnDangerText}>Remove</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={s.addAccountBtn} onPress={() => navigation.navigate('Setup')}>
            <Text style={s.addAccountIcon}>+</Text>
            <Text style={s.addAccountText}>Add Account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Email Signature ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Email Signature</Text>

          {activeAccount ? (
            <View style={s.card}>
              {editingSignature ? (
                <>
                  <Text style={s.sigEditorLabel}>Design your signature</Text>
                  <RichTextEditor
                    value={signatureHtml}
                    onChange={setSignatureHtml}
                    minHeight={240}
                  />
                  <View style={[s.rowActions, { paddingTop: spacing.md }]}>
                    <TouchableOpacity style={s.btnSec} onPress={() => setEditingSignature(false)}>
                      <Text style={s.btnSecText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnPri} onPress={handleSaveSignature}>
                      <Text style={s.btnPriText}>Save Signature</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.sigEditorLabel}>Preview</Text>
                  <SignaturePreview html={currentSignature?.html || ''} />
                  <TouchableOpacity
                    style={[s.btnSec, { marginTop: spacing.md, alignSelf: 'flex-start' }]}
                    onPress={() => { setSignatureHtml(currentSignature?.html || ''); setEditingSignature(true); }}
                  >
                    <Text style={s.btnSecText}>{currentSignature ? 'Edit Signature' : '+ Add Signature'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <Text style={s.emptyNote}>Add an account to configure a signature.</Text>
          )}
        </View>

        {/* ── Switch / Logout ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Session</Text>
          <View style={s.card}>
            {accounts.length > 1 && (
              <TouchableOpacity
                style={s.sessionRow}
                onPress={() => useAccountsStore.setState({ activeAccountId: null })}
              >
                <Text style={s.sessionIcon}>⇄</Text>
                <View style={s.sessionInfo}>
                  <Text style={s.sessionLabel}>Switch Account</Text>
                  <Text style={s.sessionSub}>Choose a different account</Text>
                </View>
                <Text style={s.sessionArrow}>›</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.sessionRow, s.sessionRowLast]}
              onPress={logout}
            >
              <Text style={[s.sessionIcon, { color: '#EF4444' }]}>⏻</Text>
              <View style={s.sessionInfo}>
                <Text style={[s.sessionLabel, { color: '#EF4444' }]}>Log Out</Text>
                <Text style={s.sessionSub}>Return to account picker</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>About</Text>
          <View style={s.card}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>App</Text>
              <Text style={s.infoValue}>StratumMail Mzansi</Text>
            </View>
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={s.infoLabel}>Version</Text>
              <Text style={s.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
    ...shadows.card,
  },
  backBtn: { padding: spacing.sm, width: 40 },
  backIcon: { fontSize: 22, color: colors.accent },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  content: { flex: 1 },

  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.md,
  },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    marginBottom: spacing.md, borderWidth: 1.5, borderColor: 'transparent',
    overflow: 'hidden', padding: spacing.lg, ...shadows.card,
  },
  cardActive: { borderColor: colors.accent },

  accountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  accountInfo: { flex: 1, marginLeft: spacing.md },
  accountName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  accountEmail: { fontSize: fontSize.sm, color: colors.secondary, marginTop: 2 },
  nameInput: {
    fontSize: fontSize.lg, fontWeight: '700', color: colors.primary,
    borderBottomWidth: 2, borderBottomColor: colors.accent, paddingVertical: 2, marginBottom: 2,
  },
  fieldError: { fontSize: fontSize.xs, color: colors.red, marginTop: 3 },
  defaultBadge: { backgroundColor: colors.accentLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  defaultBadgeText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '700' },

  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },

  btnPri: {
    backgroundColor: colors.accent, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg, minWidth: 72, alignItems: 'center', ...shadows.button,
  },
  btnPriText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  btnSec: {
    backgroundColor: colors.accentLight, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg, minWidth: 72, alignItems: 'center',
  },
  btnSecText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },
  btnDanger: {
    backgroundColor: '#FEF2F2', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg, minWidth: 72, alignItems: 'center',
  },
  btnDangerText: { color: colors.red, fontWeight: '600', fontSize: fontSize.sm },

  addAccountBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl, borderWidth: 2, borderColor: colors.accent,
    borderStyle: 'dashed', ...shadows.card,
  },
  addAccountIcon: { fontSize: 20, color: colors.accent, marginRight: spacing.sm },
  addAccountText: { fontSize: fontSize.base, fontWeight: '600', color: colors.accent },

  sigEditorLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  sigPreviewWrap: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.divider, minHeight: 60 },
  sigPlaceholder: { fontSize: fontSize.base, color: colors.textLight, fontStyle: 'italic', paddingVertical: spacing.md },

  emptyNote: { fontSize: fontSize.base, color: colors.textMuted, fontStyle: 'italic' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: fontSize.base, color: colors.primary },
  infoValue: { fontSize: fontSize.base, color: colors.secondary },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sessionRowLast: { borderBottomWidth: 0 },
  sessionIcon: { fontSize: 20, width: 32, color: colors.accent, textAlign: 'center' },
  sessionInfo: { flex: 1, marginLeft: spacing.md },
  sessionLabel: { fontSize: fontSize.base, fontWeight: '600', color: colors.primary },
  sessionSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  sessionArrow: { fontSize: 22, color: colors.textLight },
});
