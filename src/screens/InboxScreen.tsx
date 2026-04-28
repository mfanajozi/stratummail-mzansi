import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useEmailsStore, useUIStore } from '../store';
import { EmailCard } from '../components/EmailCard';
import { Email } from '../types';
import { groupEmailsByDate } from '../utils/dateUtils';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { emailService, folderService } from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stratummail-mzansi.onrender.com/api';

export function InboxScreen({ navigation }: any) {
  const { accounts, activeAccountId } = useAccountsStore();
  const { emails, setEmails, setSelectedEmail, setFolders, folders } = useEmailsStore();
  const { currentFolder, setCurrentFolder } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('Today');
  const [loading, setLoading] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountEmails = activeAccountId ? emails[activeAccountId] || [] : [];
  const groupedEmails = groupEmailsByDate(accountEmails);

  const fetchEmails = useCallback(async () => {
    if (!activeAccountId || !activeAccount?.id) return;
    
    setLoading(true);
    try {
      const accountId = activeAccount.id;
      const folder = currentFolder || 'INBOX';
      
      const [fetchedEmails, fetchedFolders] = await Promise.all([
        fetch(`${API_URL}/emails/${accountId}?folder=${folder}`).then(r => r.json()),
        fetch(`${API_URL}/folders/${accountId}`).then(r => r.json())
      ]);
      
      setEmails(accountId, fetchedEmails);
      setFolders(accountId, fetchedFolders);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, activeAccount, currentFolder, setEmails, setFolders]);

  useEffect(() => {
    if (activeAccountId) {
      fetchEmails();
    }
  }, [activeAccountId, currentFolder, fetchEmails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmails().finally(() => setRefreshing(false));
  };

  const handleEmailPress = (email: Email) => {
    setSelectedEmail(email);
    navigation.navigate('EmailView', { emailId: email.id });
  };

  const renderEmailGroup = ({ item }: { item: { group: string; emails: Email[] } }) => (
    <View style={styles.groupSection}>
      <Text style={styles.groupHeader}>{item.group}</Text>
      {item.emails.map((email) => (
        <EmailCard
          key={email.id}
          email={email}
          onPress={handleEmailPress}
        />
      ))}
    </View>
  );

  const emailGroups = Object.entries(groupedEmails).map(([group, emails]) => ({
    group,
    emails: emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.accountName}>
            {activeAccount?.displayName || 'Inbox'}
          </Text>
          <Text style={styles.accountEmail}>
            {activeAccount?.email || ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.accountSwitcher}
          onPress={() => navigation.navigate('Accounts')}
        >
          <Text style={styles.accountSwitcherIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.folderTabs}>
        {activeAccountId && folders[activeAccountId] ? (
          folders[activeAccountId].slice(0, 5).map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[styles.folderTab, currentFolder === folder.path && styles.folderTabActive]}
              onPress={() => setCurrentFolder(folder.path)}
            >
              <Text style={[styles.folderTabText, currentFolder === folder.path && styles.folderTabTextActive]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <>
            <TouchableOpacity
              style={[styles.folderTab, currentFolder === 'INBOX' && styles.folderTabActive]}
              onPress={() => setCurrentFolder('INBOX')}
            >
              <Text style={[styles.folderTabText, currentFolder === 'INBOX' && styles.folderTabTextActive]}>
                Inbox
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.folderTab, currentFolder === 'Sent' && styles.folderTabActive]}
              onPress={() => setCurrentFolder('Sent')}
            >
              <Text style={[styles.folderTabText, currentFolder === 'Sent' && styles.folderTabTextActive]}>
                Sent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.folderTab, currentFolder === 'Drafts' && styles.folderTabActive]}
              onPress={() => setCurrentFolder('Drafts')}
            >
              <Text style={[styles.folderTabText, currentFolder === 'Drafts' && styles.folderTabTextActive]}>
                Drafts
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={emailGroups}
          renderItem={renderEmailGroup}
          keyExtractor={(item) => item.group}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No emails yet</Text>
              <Text style={styles.emptySubtext}>
                Your inbox is empty. Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Compose')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  headerLeft: {
    flex: 1,
  },
  accountName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  accountEmail: {
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  accountSwitcher: {
    padding: spacing.sm,
  },
  accountSwitcherIcon: {
    fontSize: 24,
    color: colors.secondary,
  },
  folderTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  folderTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
  },
  folderTabActive: {
    backgroundColor: colors.accent,
  },
  folderTabText: {
    fontSize: fontSize.md,
    color: colors.secondary,
    fontWeight: '500',
  },
  folderTabTextActive: {
    color: colors.surface,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  groupSection: {
    marginBottom: spacing.sm,
  },
  groupHeader: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.surface,
    lineHeight: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});