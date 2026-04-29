import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAccountsStore, useEmailsStore, useUIStore } from '../store';
import { EmailCard } from '../components/EmailCard';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { Email } from '../types';
import { groupEmailsByDate } from '../utils/dateUtils';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export function InboxScreen({ navigation }: any) {
  const { accounts, activeAccountId } = useAccountsStore();
  const { emails, setEmails, setSelectedEmail, setFolders, folders } = useEmailsStore();
  const { currentFolder, setCurrentFolder } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountEmails = activeAccountId ? emails[activeAccountId] || [] : [];
  const accountFolders = activeAccountId ? folders[activeAccountId] : undefined;
  const groupedEmails = groupEmailsByDate(accountEmails);

  const fetchEmails = useCallback(async () => {
    if (!activeAccountId || !activeAccount?.id) return;
    setLoading(true);
    try {
      const accountId = activeAccount.id;
      const folder = currentFolder || 'INBOX';

      const [emailsRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/emails/${accountId}?folder=${encodeURIComponent(folder)}`),
        fetch(`${API_URL}/folders/${accountId}`),
      ]);

      if (!emailsRes.ok) throw new Error((await emailsRes.json()).error || 'Failed to fetch emails');
      if (!foldersRes.ok) throw new Error((await foldersRes.json()).error || 'Failed to fetch folders');

      const [fetchedEmails, fetchedFolders] = await Promise.all([
        emailsRes.json(),
        foldersRes.json(),
      ]);

      setEmails(accountId, fetchedEmails);
      setFolders(accountId, fetchedFolders);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, activeAccount, currentFolder, setEmails, setFolders]);

  useEffect(() => {
    if (activeAccountId) {
      // Clear stale emails immediately so previous folder's emails aren't shown
      setEmails(activeAccountId, []);
      fetchEmails();
    }
  }, [activeAccountId, currentFolder]);

  const onRefresh = () => { setRefreshing(true); fetchEmails().finally(() => setRefreshing(false)); };

  const handleEmailPress = (email: Email) => {
    setSelectedEmail(email);
    navigation.navigate('EmailView', { emailId: email.id });
  };

  const emailGroups = Object.entries(groupedEmails).map(([group, emails]) => ({
    group,
    emails: emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }));

  const displayFolders = accountFolders ?? [
    { id: 'INBOX', name: 'Inbox', path: 'INBOX', unreadCount: 0, isSpecial: true },
    { id: 'Sent',  name: 'Sent',  path: 'Sent',  unreadCount: 0, isSpecial: true },
    { id: 'Drafts', name: 'Drafts', path: 'Drafts', unreadCount: 0, isSpecial: true },
  ];

  const unreadCount = accountEmails.filter((e) => !e.isRead).length;
  const initials = activeAccount ? getAvatarInitials(activeAccount.email, activeAccount.displayName) : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.headerLogo} resizeMode="cover" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeAccount?.displayName || 'Inbox'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {activeAccount?.email || 'No account'}
          </Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Settings')}>
          <Avatar initials={initials} seed={activeAccount?.email ?? ''} size="small" />
        </TouchableOpacity>
      </View>

      {/* ── Folder tabs ── */}
      <View style={styles.folderRow}>
        {displayFolders.slice(0, 5).map((folder) => {
          const active = currentFolder === folder.path;
          return (
            <TouchableOpacity
              key={folder.id}
              style={[styles.folderTab, active && styles.folderTabActive]}
              onPress={() => setCurrentFolder(folder.path)}
              activeOpacity={0.8}
            >
              {active ? (
                <LinearGradient
                  colors={['#818CF8', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.folderTabGrad}
                >
                  <Text style={styles.folderTabTextActive}>{folder.name}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.folderTabText}>{folder.name}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Unread bar ── */}
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadBarText}>{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* ── Email list ── */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={emailGroups}
          renderItem={({ item }) => (
            <View style={styles.groupSection}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupHeader}>{item.group}</Text>
                <View style={styles.groupHeaderLine} />
              </View>
              {item.emails.map((email) => (
                <EmailCard key={email.id} email={email} onPress={handleEmailPress} />
              ))}
            </View>
          )}
          keyExtractor={(item) => item.group}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No emails yet</Text>
              <Text style={styles.emptySub}>Pull down to refresh</Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Compose')} activeOpacity={0.85}>
        <LinearGradient
          colors={['#818CF8', '#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGrad}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    ...shadows.card,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: spacing.md,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  headerSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  avatarBtn: { marginLeft: spacing.md },

  // Folder tabs
  folderRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  folderTab: { borderRadius: borderRadius.full, overflow: 'hidden' },
  folderTabActive: { ...shadows.button },
  folderTabGrad: {
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  folderTabText: {
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  folderTabTextActive: {
    fontSize: fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Unread indicator
  unreadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentLight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99,102,241,0.15)',
  },
  unreadDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  unreadBarText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },

  // List
  list: { paddingTop: spacing.sm, paddingBottom: 100 },
  groupSection: { marginBottom: spacing.sm },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  groupHeader: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: spacing.md,
  },
  groupHeaderLine: { flex: 1, height: 1, backgroundColor: colors.divider },

  // Loading / empty
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 60, marginBottom: spacing.lg, opacity: 0.6 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
  emptySub: { fontSize: fontSize.base, color: colors.textLight },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    borderRadius: 30,
    overflow: 'hidden',
    ...shadows.button,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGrad: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
});
