import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Email } from '../types';
import { Avatar, getAvatarInitials } from './Avatar';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface EmailCardProps {
  email: Email;
  onPress: (email: Email) => void;
}

export function EmailCard({ email, onPress }: EmailCardProps) {
  const initials = getAvatarInitials(email.from.address, email.from.name);

  return (
    <TouchableOpacity
      style={[styles.container, !email.isRead && styles.unread]}
      onPress={() => onPress(email)}
      activeOpacity={0.7}
    >
      <Avatar initials={initials} size="medium" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.sender,
              !email.isRead && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {email.from.name || email.from.address}
          </Text>
          <Text style={styles.time}>{formatRelativeDate(email.date)}</Text>
        </View>
        
        <Text
          style={[
            styles.subject,
            !email.isRead && styles.unreadTextBold,
          ]}
          numberOfLines={1}
        >
          {email.subject || '(No subject)'}
        </Text>
        
        <Text style={styles.preview} numberOfLines={1}>
          {email.preview}
        </Text>
      </View>
      
      {email.hasAttachments && (
        <View style={styles.attachmentIcon}>
          <Text style={styles.attachmentText}>📎</Text>
        </View>
      )}
      
      {!email.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unread: {
    backgroundColor: '#F0F7FF',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sender: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    color: colors.primary,
  },
  time: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  subject: {
    fontSize: fontSize.base,
    color: colors.secondary,
    marginBottom: 2,
  },
  unreadTextBold: {
    fontWeight: '500',
    color: colors.primary,
  },
  preview: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  attachmentIcon: {
    marginLeft: spacing.sm,
  },
  attachmentText: {
    fontSize: 14,
  },
  unreadDot: {
    position: 'absolute',
    left: spacing.xs,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.unread,
  },
});