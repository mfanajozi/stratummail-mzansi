import React, { useState, useEffect, useCallback, useRef } from 'react';
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
const POLL_INTERVAL = 30_000; // 30 seconds
const PAGE_SIZE = 50;

export function InboxScreen({ navigation }: any) {
  const { accounts, activeAccountId } = useAccountsStore();
  const { emails, setEmails, prependEmails, appendEmails, setSelectedEmail, setFolders, folders } = useEmailsStore();
  const { currentFolder, setCurrentFolder } = useUIStore();

  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [newCount, setNewCount]       = useState(0);  // emails arrived since last clear

  const listRef = useRef<FlatList>(null);
  // Ref keeps latest email list accessible in poll closure without re-subscribing
  const emailsRef = useRef<Email[]>([]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountEmails = activeAccountId ? emails[activeAccountId] || [] : [];
  emailsRef.current = accountEmails;

  const accountFolders = activeAccountId ? folders[activeAccountId] : undefined;
  const groupedEmails  = groupEmailsByDate(accountEmails);
  const unreadCount    = accountEmails.filter((e) => !e.isRead).length;
  const initials       = activeAccount ? getAvatarInitials(activeAccount.email, activeAccount.displayName) : '?';

  const displayFolders = accountFolders ?? [
    { id: 'INBOX',  name: 'Inbox',  path: 'INBOX',  unreadCount: 0, isSpecial: true },
    { id: 'Sent',   name: 'Sent',   path: 'Sent',   unreadCount: 0, isSpecial: true },
    { id: 'Drafts', name: 'Drafts', path: 'Drafts', unreadCount: 0, isSpecial: true },
  ];

  // ── Full fetch (page 1) ────────────────────────────────────────────────────
  const fetchEmails = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const [emailsRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/emails/${activeAccountId}?folder=${encodeURIComponent(currentFolder)}&page=1&limit=${PAGE_SIZE}`),
        fetch(`${API_URL}/folders/${activeAccountId}`),
      ]);
      if (emailsRes.ok)  setEmails(activeAccountId, await emailsRes.json());
      if (foldersRes.ok) setFolders(activeAccountId, await foldersRes.json());
      setPage(1);
      setHasMore(true);
      setNewCount(0);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, currentFolder]);

  // ── Load more (next page) ──────────────────────────────────────────────────
  const loadMore = async () => {
    if (!activeAccountId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `${API_URL}/emails/${activeAccountId}?folder=${encodeURIComponent(currentFolder)}&page=${nextPage}&limit=${PAGE_SIZE}`
      );
      if (res.ok) {
        const more: Email[] = await res.json();
        if (more.length > 0) {
          appendEmails(activeAccountId, more);
          setPage(nextPage);
          setHasMore(more.length >= PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Live poll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeAccountId) return;

    const poll = async () => {
      const latest = emailsRef.current[0];
      if (!latest) return;
      try {
        const since = encodeURIComponent(new Date(latest.date).toISOString());
        const res = await fetch(
          `${API_URL}/emails/${activeAccountId}?folder=${encodeURIComponent(currentFolder)}&since=${since}`
        );
        if (!res.ok) return;
        const fresh: Email[] = await res.json();
        if (fresh.length > 0) {
          prependEmails(activeAccountId, fresh);
          setNewCount((n) => n + fresh.length);
        }
      } catch { /* silent — background poll */ }
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [activeAccountId, currentFolder]);

  // Reset + fetch when account or folder changes
  useEffect(() => {
    if (activeAccountId) {
      setEmails(activeAccountId, []);
      setPage(1);
      setHasMore(true);
      setNewCount(0);
      fetchEmails();
    }
  }, [activeAccountId, currentFolder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmails().finally(() => setRefreshing(false));
  };

  const handleEmailPress = (email: Email) => {
    setSelectedEmail(email);
    navigation.navigate('EmailView', { emailId: email.id });
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setNewCount(0);
  };

  const emailGroups = Object.entries(groupedEmails).map(([group, grpEmails]) => ({
    group,
    emails: grpEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }));

  // ── Footer: load more button ───────────────────────────────────────────────
  const ListFooter = () => {
    if (accountEmails.length === 0) return null;
    if (loadingMore) {
      return (
        <View style={styles.footerWrap}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.footerText}>Loading older emails…</Text>
        </View>
      );
    }
    if (!hasMore) {
      return (
        <View style={styles.footerWrap}>
          <Text style={styles.footerTextMuted}>— All emails loaded —</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
        <Text style={styles.loadMoreText}>Load 50 more older emails</Text>
      </TouchableOpacity>
    );
  };

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
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          disabled={refreshing || loading}
          activeOpacity={0.7}
        >
          {refreshing || loading
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Text style={styles.refreshIcon}>↻</Text>}
        </TouchableOpacity>
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
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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

      {/* ── New-email banner ── */}
      {newCount > 0 && (
        <TouchableOpacity style={styles.newBanner} onPress={scrollToTop} activeOpacity={0.85}>
          <Text style={styles.newBannerText}>
            ↑  {newCount} new email{newCount !== 1 ? 's' : ''} — tap to view
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Unread bar ── */}
      {unreadCount > 0 && newCount === 0 && (
        <View style={styles.unreadBar}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadBarText}>{unreadCount} unread</Text>
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
          ref={listRef}
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
          ListFooterComponent={<ListFooter />}
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
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    ...shadows.card,
  },
  headerLogo: {
    width: 36, height: 36, borderRadius: 10, marginRight: spacing.md,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  headerSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  refreshIcon: { fontSize: 20, color: colors.accent, fontWeight: '700' },
  avatarBtn: { marginLeft: spacing.sm },

  folderRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.sm,
  },
  folderTab: { borderRadius: borderRadius.full, overflow: 'hidden' },
  folderTabActive: { ...shadows.button },
  folderTabGrad: { paddingVertical: spacing.sm - 1, paddingHorizontal: spacing.lg, borderRadius: borderRadius.full },
  folderTabText: { paddingVertical: spacing.sm - 1, paddingHorizontal: spacing.md, fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },
  folderTabTextActive: { fontSize: fontSize.sm, color: '#FFFFFF', fontWeight: '700' },

  newBanner: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  newBannerText: { fontSize: fontSize.sm, color: '#FFFFFF', fontWeight: '700' },

  unreadBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.accentLight,
    borderBottomWidth: 1, borderBottomColor: 'rgba(99,102,241,0.15)',
  },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: spacing.sm },
  unreadBarText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '600' },

  list: { paddingTop: spacing.sm, paddingBottom: 100 },
  groupSection: { marginBottom: spacing.sm },
  groupHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  groupHeader: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: spacing.md },
  groupHeaderLine: { flex: 1, height: 1, backgroundColor: colors.divider },

  footerWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: fontSize.sm, color: colors.textMuted, marginLeft: spacing.sm },
  footerTextMuted: { fontSize: fontSize.xs, color: colors.textLight },
  loadMoreBtn: {
    marginHorizontal: spacing.xl, marginVertical: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
  },
  loadMoreText: { fontSize: fontSize.base, fontWeight: '600', color: colors.accent },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.md },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: spacing.xxl },
  emptyIcon: { fontSize: 60, marginBottom: spacing.lg, opacity: 0.6 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
  emptySub: { fontSize: fontSize.base, color: colors.textLight },

  fab: {
    position: 'absolute', right: spacing.xl, bottom: spacing.xl,
    borderRadius: 30, overflow: 'hidden',
    ...shadows.button, shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  fabGrad: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
});
