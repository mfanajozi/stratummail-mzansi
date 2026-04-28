import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmailsStore } from '../store';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { formatFullDate } from '../utils/dateUtils';
import { colors, spacing, fontSize, borderRadius } from '../theme';

export function EmailViewScreen({ route, navigation }: any) {
  const { selectedEmail } = useEmailsStore();
  const email = selectedEmail;

  if (!email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Email not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = getAvatarInitials(email.from.address, email.from.name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>↩</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>☆</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subject}>{email.subject || '(No subject)'}</Text>

        <View style={styles.senderRow}>
          <Avatar initials={initials} size="large" />
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>
              {email.from.name || email.from.address}
            </Text>
            <Text style={styles.senderEmail}>{email.from.address}</Text>
            <View style={styles.recipientRow}>
              <Text style={styles.recipientLabel}>To: </Text>
              <Text style={styles.recipientEmail}>
                {email.to.join(', ')}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>
            {formatFullDate(email.date)}
          </Text>
        </View>

        <View style={styles.bodyContainer}>
          <Text style={styles.body}>{email.body}</Text>
        </View>

        {email.hasAttachments && (
          <View style={styles.attachments}>
            <Text style={styles.attachmentsHeader}>Attachments</Text>
            <View style={styles.attachmentList}>
              <TouchableOpacity style={styles.attachmentItem}>
                <Text style={styles.attachmentIcon}>📎</Text>
                <Text style={styles.attachmentName}>document.pdf</Text>
                <Text style={styles.attachmentSize}>2.4 MB</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.replyBar}>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => navigation.navigate('Compose', { replyTo: email })}
        >
          <Text style={styles.replyIcon}>↩</Text>
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => navigation.navigate('Compose', { forward: email })}
        >
          <Text style={styles.replyIcon}>↪</Text>
          <Text style={styles.replyText}>Forward</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
    color: colors.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subject: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  senderInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  senderName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  senderEmail: {
    fontSize: fontSize.md,
    color: colors.secondary,
  },
  recipientRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  recipientLabel: {
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  recipientEmail: {
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  bodyContainer: {
    paddingBottom: spacing.xxl,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.primary,
    lineHeight: 24,
  },
  attachments: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  attachmentsHeader: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  attachmentIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  attachmentName: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  attachmentSize: {
    fontSize: fontSize.sm,
    color: colors.secondary,
  },
  replyBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.sm,
  },
  replyIcon: {
    fontSize: 18,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  replyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.secondary,
  },
});