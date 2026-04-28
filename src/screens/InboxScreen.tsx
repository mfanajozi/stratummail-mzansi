import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore, useEmailsStore, useUIStore } from '../store';
import { EmailCard } from '../components/EmailCard';
import { Email } from '../types';
import { groupEmailsByDate } from '../utils/dateUtils';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    accountId: '1',
    subject: 'Meeting reminder',
    from: { name: 'John Smith', address: 'john@example.com' },
    to: ['user@example.com'],
    preview: 'Don\'t forget about our meeting tomorrow at 2pm...',
    body: 'Don\'t forget about our meeting tomorrow at 2pm to discuss the new project.',
    date: new Date(),
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    folder: 'INBOX',
  },
  {
    id: '2',
    accountId: '1',
    subject: 'Project update',
    from: { name: 'Sarah Johnson', address: 'sarah@company.co.za' },
    to: ['user@example.com'],
    preview: 'Here\'s the latest update on our ongoing projects...',
    body: 'Here\'s the latest update on our ongoing projects. Let me know if you have any questions.',
    date: new Date(Date.now() - 86400000),
    isRead: true,
    isStarred: true,
    hasAttachments: true,
    folder: 'INBOX',
  },
  {
    id: '3',
    accountId: '1',
    subject: 'Invoice attached',
    from: { name: 'Accounts Dept', address: 'accounts@vendor.co.za' },
    to: ['user@example.com'],
    preview: 'Please find attached the invoice for this month...',
    body: 'Please find attached the invoice for this month. Payment is due within 30 days.',
    date: new Date(Date.now() - 172800000),
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    folder: 'INBOX',
  },
  {
    id: '4',
    accountId: '1',
    subject: 'Weekly newsletter',
    from: { name: 'Tech Weekly', address: 'newsletter@techweekly.com' },
    to: ['user@example.com'],
    preview: 'This week in tech: new AI developments, startup news...',
    body: 'This week in tech: new AI developments, startup news, and more.',
    date: new Date(Date.now() - 432000000),
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    folder: 'INBOX',
  },
];

export function InboxScreen({ navigation }: any) {
  const { accounts, activeAccountId } = useAccountsStore();
  const { emails, setEmails, setSelectedEmail } = useEmailsStore();
  const { currentFolder, setComposeModalVisible } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('Today');

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const accountEmails = activeAccountId ? emails[activeAccountId] || MOCK_EMAILS : MOCK_EMAILS;
  const groupedEmails = groupEmailsByDate(accountEmails);

  useEffect(() => {
    if (activeAccountId) {
      setEmails(activeAccountId, MOCK_EMAILS);
    }
  }, [activeAccountId]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
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
        <TouchableOpacity
          style={[styles.folderTab, currentFolder === 'INBOX' && styles.folderTabActive]}
          onPress={() => {}}
        >
          <Text style={[styles.folderTabText, currentFolder === 'INBOX' && styles.folderTabTextActive]}>
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.folderTab, currentFolder === 'SENT' && styles.folderTabActive]}
          onPress={() => {}}
        >
          <Text style={[styles.folderTabText, currentFolder === 'SENT' && styles.folderTabTextActive]}>
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.folderTab, currentFolder === 'DRAFT' && styles.folderTabActive]}
          onPress={() => {}}
        >
          <Text style={[styles.folderTabText, currentFolder === 'DRAFT' && styles.folderTabTextActive]}>
            Drafts
          </Text>
        </TouchableOpacity>
      </View>

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
              Your inbox is empty. Tap compose to send a new email.
            </Text>
          </View>
        }
      />

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
});