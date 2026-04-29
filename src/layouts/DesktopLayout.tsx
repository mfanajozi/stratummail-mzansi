import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useEmailsStore, useUIStore, useSignaturesStore } from '../store';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { formatRelativeDate, formatFullDate } from '../utils/dateUtils';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';
import { Email, Folder } from '../types';
import { EmailBodyView } from '../components/EmailBodyView';
import { RichTextEditor } from '../components/RichTextEditor';

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return {}; }
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const LOGO = require('../../assets/icon.png');

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

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'INBOX',  name: 'Inbox',  path: 'INBOX',  unreadCount: 0, isSpecial: true },
  { id: 'Sent',   name: 'Sent',   path: 'Sent',   unreadCount: 0, isSpecial: true },
  { id: 'Drafts', name: 'Drafts', path: 'Drafts', unreadCount: 0, isSpecial: true },
  { id: 'Trash',  name: 'Trash',  path: 'Trash',  unreadCount: 0, isSpecial: true },
  { id: 'Spam',   name: 'Spam',   path: 'Spam',   unreadCount: 0, isSpecial: true },
];

const FOLDER_ICONS: Record<string, string> = {
  Inbox: '📥', Sent: '📤', Drafts: '📝',
  Trash: '🗑', Spam: '⚠️', Junk: '⚠️',
};
const folderIcon = (n: string) => FOLDER_ICONS[n] || '📁';

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ folders, currentFolder, onFolderSelect, accounts, activeAccountId, onAccountSelect, onCompose, onSettings, onLogout, onSwitchAccount }: any) {
  return (
    <View style={s.sidebar}>
      {/* Brand header */}
      <View style={s.sidebarHeader}>
        <Image source={LOGO} style={s.sidebarLogo} resizeMode="cover" />
        <View style={s.sidebarBrand}>
          <Text style={s.sidebarBrandName}>StratumMail</Text>
          <Text style={s.sidebarBrandSub}>Mzansi</Text>
        </View>
      </View>

      {/* Compose */}
      <View style={s.composeWrap}>
        <TouchableOpacity style={s.composeBtn} onPress={onCompose} activeOpacity={0.85}>
          <LinearGradient
            colors={['#818CF8', '#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.composeBtnGrad}
          >
            <Text style={s.composeBtnIcon}>✏</Text>
            <Text style={s.composeBtnText}>Compose</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Folders */}
      <Text style={s.sidebarGroupLabel}>MAILBOXES</Text>
      <ScrollView style={s.folderList} showsVerticalScrollIndicator={false}>
        {folders.map((folder: Folder) => {
          const active = currentFolder === folder.path;
          return (
            <TouchableOpacity
              key={folder.id}
              style={[s.folderItem, active && s.folderItemActive]}
              onPress={() => onFolderSelect(folder.path)}
              activeOpacity={0.75}
            >
              <Text style={[s.folderItemIcon, active && s.folderItemIconActive]}>
                {folderIcon(folder.name)}
              </Text>
              <Text style={[s.folderItemName, active && s.folderItemNameActive]}>
                {folder.name}
              </Text>
              {folder.unreadCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{folder.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer: accounts + settings */}
      <View style={s.sidebarFooter}>
        <View style={s.footerDivider} />
        <Text style={s.sidebarGroupLabel}>ACCOUNTS</Text>
        {accounts.map((acc: any) => (
          <TouchableOpacity
            key={acc.id}
            style={[s.accountItem, activeAccountId === acc.id && s.accountItemActive]}
            onPress={() => onAccountSelect(acc.id)}
            activeOpacity={0.8}
          >
            <Avatar initials={getAvatarInitials(acc.email, acc.displayName)} seed={acc.email} size="small" />
            <View style={s.accountItemInfo}>
              <Text style={s.accountItemName} numberOfLines={1}>{acc.displayName}</Text>
              <Text style={s.accountItemEmail} numberOfLines={1}>{acc.email}</Text>
            </View>
            {activeAccountId === acc.id && <View style={s.accountActiveDot} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.settingsBtn} onPress={onSettings} activeOpacity={0.8}>
          <Text style={s.settingsBtnIcon}>⚙</Text>
          <Text style={s.settingsBtnText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.settingsBtn} onPress={onSwitchAccount} activeOpacity={0.8}>
          <Text style={s.settingsBtnIcon}>⇄</Text>
          <Text style={s.settingsBtnText}>Switch Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.settingsBtn, s.logoutBtn]} onPress={onLogout} activeOpacity={0.8}>
          <Text style={s.settingsBtnIcon}>⏻</Text>
          <Text style={[s.settingsBtnText, s.logoutText]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Email list item ────────────────────────────────────────────────────────────

function EmailListItem({ email, isSelected, onPress }: { email: Email; isSelected: boolean; onPress: (e: Email) => void }) {
  const initials = getAvatarInitials(email.from.address, email.from.name);
  return (
    <TouchableOpacity
      style={[s.emailItem, !email.isRead && s.emailItemUnread, isSelected && s.emailItemSelected]}
      onPress={() => onPress(email)}
      activeOpacity={0.8}
    >
      {!email.isRead && <View style={s.unreadBar} />}
      <Avatar initials={initials} seed={email.from.address} size="small" />
      <View style={s.emailItemBody}>
        <View style={s.emailItemTop}>
          <Text style={[s.emailItemSender, !email.isRead && s.bold]} numberOfLines={1}>
            {email.from.name || email.from.address}
          </Text>
          <Text style={[s.emailItemTime, isSelected && s.emailItemTimeSelected]}>
            {formatRelativeDate(email.date)}
          </Text>
        </View>
        <Text style={[s.emailItemSubject, !email.isRead && s.bold]} numberOfLines={1}>
          {email.subject || '(No subject)'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Email detail ───────────────────────────────────────────────────────────────

function EmailDetail({ email, onReply, onForward, onDelete }: any) {
  if (!email) {
    return (
      <View style={s.emptyDetail}>
        <Image source={LOGO} style={s.emptyDetailLogo} resizeMode="contain" />
        <Text style={s.emptyDetailTitle}>Select a message</Text>
        <Text style={s.emptyDetailSub}>Choose an email from the list to read it here</Text>
      </View>
    );
  }

  const initials = getAvatarInitials(email.from.address, email.from.name);
  const toList = Array.isArray(email.to) ? email.to.join(', ') : String(email.to || '');

  return (
    <View style={s.detailWrapper}>
      {/* Toolbar */}
      <View style={s.detailToolbar}>
        <TouchableOpacity style={s.toolbarBtn} onPress={onReply}>
          <Text style={s.toolbarBtnIcon}>↩</Text>
          <Text style={s.toolbarBtnText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.toolbarBtn} onPress={onForward}>
          <Text style={s.toolbarBtnIcon}>↪</Text>
          <Text style={s.toolbarBtnText}>Forward</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[s.toolbarBtn, s.toolbarBtnDanger]} onPress={onDelete}>
          <Text style={s.toolbarBtnIcon}>🗑</Text>
          <Text style={[s.toolbarBtnText, { color: colors.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.detailScroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.detailScrollContent}>
        {/* Subject */}
        <Text style={s.detailSubject}>{email.subject || '(No subject)'}</Text>

        {/* Sender card */}
        <View style={s.detailSenderCard}>
          <Avatar initials={initials} seed={email.from.address} size="large" />
          <View style={s.detailSenderInfo}>
            <Text style={s.detailSenderName}>{email.from.name || email.from.address}</Text>
            <Text style={s.detailSenderEmail}>{email.from.address}</Text>
            {toList ? <Text style={s.detailTo}>To: {toList}</Text> : null}
          </View>
          <Text style={s.detailDate}>{formatFullDate(email.date)}</Text>
        </View>

        {/* Body */}
        <View style={s.detailBodyWrap}>
          <EmailBodyView body={email.body || email.preview || ''} autoHeight />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Compose panel (floating, bottom-right) ─────────────────────────────────────

function ComposePanel({ activeAccountId, accounts, signatures, onClose, replyTo, forward }: any) {
  const [to, setTo] = useState<string>(replyTo ? replyTo.from.address : '');
  const [subject, setSubject] = useState<string>(
    replyTo ? `Re: ${replyTo.subject}` : forward ? `Fwd: ${forward.subject}` : ''
  );
  const [body, setBody] = useState<string>(
    forward ? `\n\n---------- Forwarded ----------\nFrom: ${forward.from.name || forward.from.address}\n\n${forward.body}` : ''
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const account = accounts.find((a: any) => a.id === activeAccountId);
  const signature = activeAccountId ? signatures[activeAccountId] : null;

  const handleSend = async () => {
    if (!to.trim()) { setError('Add at least one recipient'); return; }
    setSending(true); setError('');
    try {
      const sigHtml = signature?.html || '';
      const sigText = sigHtml ? stripHtml(sigHtml) : '';
      const plainBody = sigText ? `${body}\n\n-- \n${sigText}` : body;
      const htmlBody = buildHtmlEmail(body, sigHtml);

      const res = await fetch(`${API_URL}/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: activeAccountId,
          to: to.split(',').map((e: string) => e.trim()).filter(Boolean),
          subject,
          body: plainBody,
          bodyHtml: htmlBody,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={s.composePanel}>
      {/* Header */}
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={s.composePanelHeader}>
        <Text style={s.composePanelTitle}>New Message</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.composePanelClose}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={s.composePanelBody}>
        <View style={s.composeField}>
          <Text style={s.composeLabel}>From</Text>
          <Text style={s.composeFrom}>{account?.email || '—'}</Text>
        </View>
        <View style={s.composeField}>
          <Text style={s.composeLabel}>To</Text>
          <TextInput
            style={s.composeInput}
            value={to}
            onChangeText={setTo}
            placeholder="Recipients"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={s.composeField}>
          <Text style={s.composeLabel}>Subject</Text>
          <TextInput
            style={[s.composeInput, { fontWeight: '600' }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            placeholderTextColor={colors.textLight}
          />
        </View>

        {error ? (
          <View style={s.composeError}>
            <Text style={s.composeErrorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={s.composeBody}
          value={body}
          onChangeText={setBody}
          placeholder="Write your message…"
          placeholderTextColor={colors.textLight}
          multiline
          textAlignVertical="top"
        />

        {signature?.html ? (
          <View style={s.composeSig}>
            <Text style={s.composeSigLabel}>— Signature</Text>
            <EmailBodyView body={signature.html} autoHeight />
          </View>
        ) : null}
      </View>

      <View style={s.composePanelFooter}>
        <TouchableOpacity onPress={onClose} style={s.composeCancelBtn}>
          <Text style={s.composeCancelText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.composeSendBtn, (!to.trim() || sending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!to.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.composeSendText}>Send ↗</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Settings panel ─────────────────────────────────────────────────────────────

function SettingsPanel({ accounts, activeAccountId, updateDisplayName, signatures, setSignature, onClose }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [editingSig, setEditingSig] = useState(false);
  const [sigHtml, setSigHtml] = useState('');

  const currentSig = activeAccountId ? signatures?.[activeAccountId] : null;

  const save = async (id: string) => {
    if (!draft.trim()) { setErr('Cannot be empty'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/account/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: draft.trim() }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || `Server error (${res.status})`);
      }
      updateDisplayName(id, draft.trim());
      setEditingId(null);
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const saveSig = () => {
    if (activeAccountId && setSignature) {
      setSignature(activeAccountId, { id: activeAccountId, accountId: activeAccountId, html: sigHtml, isDefault: true });
    }
    setEditingSig(false);
  };

  return (
    <View style={s.settingsOverlay}>
      <TouchableOpacity style={s.settingsBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={s.settingsPanel}>
        <LinearGradient colors={['#6366F1', '#4F46E5']} style={s.settingsPanelHeader}>
          <Text style={s.settingsPanelTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.composePanelClose}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={s.settingsPanelScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.settingsSectionLabel}>Accounts</Text>
          {(accounts || []).map((acc: any) => (
            <View key={acc.id} style={[s.settingsAccCard, acc.id === activeAccountId && s.settingsAccCardActive]}>
              <View style={s.settingsAccRow}>
                <Avatar initials={getAvatarInitials(acc.email, acc.displayName)} seed={acc.email} size="medium" />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  {editingId === acc.id ? (
                    <TextInput
                      style={s.settingsNameInput}
                      value={draft}
                      onChangeText={setDraft}
                      autoFocus
                    />
                  ) : (
                    <Text style={s.settingsAccName}>{acc.displayName}</Text>
                  )}
                  <Text style={s.settingsAccEmail}>{acc.email}</Text>
                  {err && editingId === acc.id ? <Text style={{ color: colors.red, fontSize: fontSize.xs, marginTop: 2 }}>{err}</Text> : null}
                </View>
              </View>
              <View style={s.settingsAccActions}>
                {editingId === acc.id ? (
                  <>
                    <TouchableOpacity style={s.sBtnSec} onPress={() => setEditingId(null)} disabled={saving}>
                      <Text style={s.sBtnSecText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.sBtnPri} onPress={() => save(acc.id)} disabled={saving}>
                      {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sBtnPriText}>Save</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={s.sBtnSec} onPress={() => { setEditingId(acc.id); setDraft(acc.displayName); setErr(''); }}>
                    <Text style={s.sBtnSecText}>Edit Name</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {/* Signature */}
          <Text style={s.settingsSectionLabel}>Email Signature</Text>
          <View style={s.sigCard}>
            {editingSig ? (
              <>
                <Text style={s.sigLabel}>Design your signature</Text>
                <RichTextEditor value={sigHtml} onChange={setSigHtml} minHeight={200} />
                <View style={[s.settingsAccActions, { marginTop: spacing.md }]}>
                  <TouchableOpacity style={s.sBtnSec} onPress={() => setEditingSig(false)}>
                    <Text style={s.sBtnSecText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.sBtnPri} onPress={saveSig}>
                    <Text style={s.sBtnPriText}>Save Signature</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={s.sigLabel}>Preview</Text>
                {currentSig?.html ? (
                  <Text style={s.sigPreviewText}>{currentSig.html.replace(/<[^>]*>/g, ' ').trim()}</Text>
                ) : (
                  <Text style={s.sigEmpty}>No signature set</Text>
                )}
                <TouchableOpacity
                  style={[s.sBtnSec, { marginTop: spacing.sm, alignSelf: 'flex-start' }]}
                  onPress={() => { setSigHtml(currentSig?.html || ''); setEditingSig(true); }}
                >
                  <Text style={s.sBtnSecText}>{currentSig ? 'Edit Signature' : '+ Add Signature'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// ── Desktop Layout root ────────────────────────────────────────────────────────

export function DesktopLayout() {
  const { accounts, activeAccountId, setActiveAccount, updateDisplayName, logout } = useAccountsStore();
  const { emails, folders, selectedEmail, setEmails, setFolders, setSelectedEmail, deleteEmail, markAsRead } = useEmailsStore();
  const { signatures } = useSignaturesStore();
  const { currentFolder, setCurrentFolder } = useUIStore();

  const [loadingEmails, setLoadingEmails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [composeReplyTo, setComposeReplyTo] = useState<Email | null>(null);
  const [composeForward, setComposeForward] = useState<Email | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountEmails = activeAccountId ? (emails[activeAccountId] || []) : [];
  const accountFolders = activeAccountId ? (folders[activeAccountId] || DEFAULT_FOLDERS) : DEFAULT_FOLDERS;
  const unreadCount = accountEmails.filter((e) => !e.isRead).length;

  const fetchEmails = useCallback(async () => {
    if (!activeAccountId) return;
    setLoadingEmails(true);
    try {
      const [emailsRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/emails/${activeAccountId}?folder=${encodeURIComponent(currentFolder)}`),
        fetch(`${API_URL}/folders/${activeAccountId}`),
      ]);
      if (emailsRes.ok) setEmails(activeAccountId, await emailsRes.json());
      if (foldersRes.ok) setFolders(activeAccountId, await foldersRes.json());
    } catch (e) {
      console.error('Fetch failed:', e);
    } finally {
      setLoadingEmails(false);
    }
  }, [activeAccountId, currentFolder]);

  useEffect(() => {
    if (activeAccountId) setEmails(activeAccountId, []); // clear stale data immediately
    setSelectedEmail(null);
    fetchEmails();
  }, [activeAccountId, currentFolder]);

  const handleEmailSelect = async (email: Email) => {
    setSelectedEmail(email);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/emails/${email.accountId}/${email.id}?folder=${encodeURIComponent(email.folder)}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedEmail(full);
        if (!email.isRead) {
          markAsRead(email.accountId, email.id);
          fetch(`${API_URL}/emails/${email.accountId}/${email.id}/read?folder=${encodeURIComponent(email.folder)}`, { method: 'PUT' });
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  };

  const handleDelete = async () => {
    if (!selectedEmail) return;
    try {
      await fetch(`${API_URL}/emails/${selectedEmail.accountId}/${selectedEmail.id}?folder=${encodeURIComponent(selectedEmail.folder)}`, { method: 'DELETE' });
      deleteEmail(selectedEmail.accountId, selectedEmail.id);
    } catch (e) { console.error(e); }
  };

  const openCompose = (replyTo?: Email | null, forward?: Email | null) => {
    setComposeReplyTo(replyTo ?? null);
    setComposeForward(forward ?? null);
    setShowCompose(true);
  };

  const currentFolderName = accountFolders.find((f) => f.path === currentFolder)?.name || 'Inbox';

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={s.layout}>

        {/* ── Sidebar ── */}
        <Sidebar
          folders={accountFolders}
          currentFolder={currentFolder}
          onFolderSelect={setCurrentFolder}
          accounts={accounts}
          activeAccountId={activeAccountId}
          onAccountSelect={setActiveAccount}
          onCompose={() => openCompose()}
          onSettings={() => setShowSettings(true)}
          onLogout={logout}
          onSwitchAccount={() => useAccountsStore.setState({ activeAccountId: null })}
        />

        {/* ── Email list ── */}
        <View style={s.listPanel}>
          <View style={s.listHeader}>
            <View style={s.listHeaderLeft}>
              <Text style={s.listHeaderTitle}>{currentFolderName}</Text>
              {unreadCount > 0 && (
                <View style={s.listHeaderBadge}>
                  <Text style={s.listHeaderBadgeText}>{unreadCount} unread</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={s.refreshBtn}
              onPress={() => { setRefreshing(true); fetchEmails().finally(() => setRefreshing(false)); }}
            >
              <Text style={s.refreshIcon}>↻</Text>
            </TouchableOpacity>
          </View>

          {loadingEmails && !refreshing ? (
            <View style={s.loadingCenter}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={s.loadingText}>Loading emails…</Text>
            </View>
          ) : (
            <FlatList
              data={accountEmails}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <EmailListItem
                  email={item}
                  isSelected={selectedEmail?.id === item.id}
                  onPress={handleEmailSelect}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); fetchEmails().finally(() => setRefreshing(false)); }}
                  tintColor={colors.accent}
                />
              }
              ListEmptyComponent={
                <View style={s.listEmpty}>
                  <Text style={s.listEmptyIcon}>📭</Text>
                  <Text style={s.listEmptyText}>No emails in {currentFolderName}</Text>
                </View>
              }
              contentContainerStyle={{ paddingVertical: spacing.xs }}
            />
          )}
        </View>

        {/* ── Detail pane ── */}
        <View style={s.detailPanel}>
          {loadingDetail ? (
            <View style={s.loadingCenter}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={s.loadingText}>Loading message…</Text>
            </View>
          ) : (
            <EmailDetail
              email={selectedEmail}
              onReply={() => openCompose(selectedEmail)}
              onForward={() => openCompose(null, selectedEmail)}
              onDelete={handleDelete}
            />
          )}
        </View>
      </View>

      {/* ── Compose overlay ── */}
      {showCompose && (
        <View style={s.composeOverlay}>
          <ComposePanel
            activeAccountId={activeAccountId}
            accounts={accounts}
            signatures={signatures}
            replyTo={composeReplyTo}
            forward={composeForward}
            onClose={() => setShowCompose(false)}
          />
        </View>
      )}

      {/* ── Settings overlay ── */}
      {showSettings && (
        <SettingsPanel
          accounts={accounts}
          activeAccountId={activeAccountId}
          updateDisplayName={updateDisplayName}
          signatures={signatures}
          setSignature={useSignaturesStore.getState().setSignature}
          onClose={() => setShowSettings(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const SIDEBAR_W = 252;
const LIST_W   = 316;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  layout: { flex: 1, flexDirection: 'row' },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: colors.sidebarBg,
    flexDirection: 'column',
    ...shadows.sidebar,
    zIndex: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sidebarLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  sidebarBrand: { marginLeft: spacing.md },
  sidebarBrandName: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sidebarBrandSub: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: 'rgba(252,211,77,0.9)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  composeWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  composeBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.button },
  composeBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  composeBtnIcon: { fontSize: 16, color: '#fff', marginRight: spacing.sm },
  composeBtnText: { fontSize: fontSize.base, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  sidebarGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(165,180,252,0.55)',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg + 4,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  folderList: { flex: 1, paddingHorizontal: spacing.sm },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: 1,
  },
  folderItemActive: { backgroundColor: colors.sidebarActiveBg },
  folderItemIcon: { fontSize: 15, width: 26, opacity: 0.85 },
  folderItemIconActive: { opacity: 1 },
  folderItemName: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.sidebarText,
    fontWeight: '500',
  },
  folderItemNameActive: { color: '#FFFFFF', fontWeight: '700' },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },

  sidebarFooter: { paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  footerDivider: { height: 1, backgroundColor: 'rgba(165,180,252,0.15)', marginHorizontal: spacing.sm, marginBottom: spacing.sm, marginTop: spacing.xs },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: 2,
  },
  accountItemActive: { backgroundColor: colors.sidebarActiveBg },
  accountItemInfo: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  accountItemName: { fontSize: fontSize.sm, fontWeight: '600', color: '#FFFFFF', lineHeight: 16 },
  accountItemEmail: { fontSize: 11, color: colors.sidebarText, lineHeight: 15 },
  accountActiveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: spacing.xs,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
  },
  settingsBtnIcon: { fontSize: 15, marginRight: spacing.sm, color: colors.sidebarText },
  settingsBtnText: { fontSize: fontSize.base, color: colors.sidebarText, fontWeight: '500' },
  logoutBtn: { marginTop: 2 },
  logoutText: { color: '#FCA5A5' },

  // ── Email list panel ──────────────────────────────────────────────────────
  listPanel: {
    width: LIST_W,
    backgroundColor: '#F7F8FF',
    borderRightWidth: 1,
    borderRightColor: colors.divider,
    flexDirection: 'column',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    ...shadows.card,
  },
  listHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listHeaderTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  listHeaderBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  listHeaderBadgeText: { fontSize: 11, color: colors.accent, fontWeight: '700' },
  refreshBtn: {
    width: 32, height: 32,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { fontSize: 16, color: colors.accent, fontWeight: '700' },

  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.card,
  },
  emailItemUnread: {
    backgroundColor: '#F0EEFF',
    borderColor: 'rgba(99,102,241,0.12)',
  },
  emailItemSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
    ...shadows.cardHover,
  },
  unreadBar: {
    position: 'absolute',
    left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 3,
    backgroundColor: colors.accent,
  },
  emailItemBody: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  emailItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  emailItemSender: { flex: 1, fontSize: fontSize.base, color: colors.secondary, marginRight: 4 },
  bold: { fontWeight: '700', color: colors.primary },
  emailItemTime: { fontSize: 11, color: colors.textLight, flexShrink: 0 },
  emailItemTimeSelected: { color: colors.accent },
  emailItemSubject: { fontSize: fontSize.sm, color: colors.textMuted },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  listEmpty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  listEmptyIcon: { fontSize: 44, marginBottom: spacing.md, opacity: 0.5 },
  listEmptyText: { fontSize: fontSize.base, color: colors.textMuted, textAlign: 'center' },

  // ── Detail panel ──────────────────────────────────────────────────────────
  detailPanel: { flex: 1, backgroundColor: colors.surface },
  detailWrapper: { flex: 1 },

  detailToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accentLight,
    gap: 5,
  },
  toolbarBtnDanger: { backgroundColor: '#FEF2F2' },
  toolbarBtnIcon: { fontSize: 15 },
  toolbarBtnText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },

  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: spacing.xxl, paddingBottom: 80, paddingTop: spacing.xl },

  detailSubject: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.lg,
    lineHeight: 30,
  },
  detailSenderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
  detailSenderInfo: { flex: 1, marginLeft: spacing.md },
  detailSenderName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  detailSenderEmail: { fontSize: fontSize.sm, color: colors.secondary, marginTop: 2 },
  detailTo: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  detailDate: { fontSize: fontSize.sm, color: colors.textLight, marginLeft: spacing.md, flexShrink: 0, textAlign: 'right' },

  detailBodyWrap: { paddingTop: spacing.sm },
  detailBody: { fontSize: fontSize.base, color: colors.primary, lineHeight: 26 },

  emptyDetail: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  emptyDetailLogo: { width: 100, height: 100, opacity: 0.25, marginBottom: spacing.xl },
  emptyDetailTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
  emptyDetailSub: { fontSize: fontSize.base, color: colors.textLight, textAlign: 'center', lineHeight: 22 },

  // ── Compose overlay ───────────────────────────────────────────────────────
  composeOverlay: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    zIndex: 100,
  },
  composePanel: {
    width: 480,
    maxHeight: 560,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    ...shadows.floating,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  composePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  composePanelTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },
  composePanelClose: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },

  composePanelBody: { flex: 1 },
  composeField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  composeLabel: { width: 52, fontSize: fontSize.sm, color: colors.secondary, fontWeight: '500' },
  composeFrom: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted },
  composeInput: { flex: 1, fontSize: fontSize.sm, color: colors.primary, paddingVertical: 2 },
  composeError: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  composeErrorText: { fontSize: fontSize.xs, color: colors.red },
  composeBody: {
    minHeight: 170,
    maxHeight: 220,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.primary,
    lineHeight: 22,
  },
  composeSig: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  composeSigLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic', paddingVertical: 4 },
  composePanelFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: '#FAFBFF',
    gap: spacing.sm,
  },
  composeCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  composeCancelText: { fontSize: fontSize.sm, color: colors.textMuted },
  composeSendBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 90,
    ...shadows.button,
  },
  composeSendText: { color: '#fff', fontWeight: '700', fontSize: fontSize.base },

  // ── Settings overlay ──────────────────────────────────────────────────────
  settingsOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  settingsBackdrop: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  settingsPanel: {
    width: 460,
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    ...shadows.floating,
    overflow: 'hidden',
    zIndex: 201,
  },
  settingsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  settingsPanelTitle: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  settingsPanelScroll: { flex: 1, paddingHorizontal: spacing.lg },
  settingsSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  settingsAccCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  settingsAccCardActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  settingsAccRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  settingsAccName: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary },
  settingsAccEmail: { fontSize: fontSize.sm, color: colors.secondary, marginTop: 2 },
  settingsNameInput: {
    fontSize: fontSize.base, fontWeight: '700', color: colors.primary,
    borderBottomWidth: 2, borderBottomColor: colors.accent, paddingVertical: 2,
  },
  settingsAccActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sBtnPri: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 64,
    alignItems: 'center',
    ...shadows.button,
  },
  sBtnPriText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  sBtnSec: {
    backgroundColor: colors.accentLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 64,
    alignItems: 'center',
  },
  sBtnSecText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },

  // Signature in settings panel
  sigCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  sigLabel: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  sigPreviewText: { fontSize: fontSize.sm, color: colors.primary, lineHeight: 20 },
  sigEmpty: { fontSize: fontSize.sm, color: colors.textLight, fontStyle: 'italic' },

});
