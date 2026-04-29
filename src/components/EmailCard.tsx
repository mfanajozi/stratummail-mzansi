import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Email } from '../types';
import { Avatar, getAvatarInitials } from './Avatar';
import { formatRelativeDate } from '../utils/dateUtils';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';

interface EmailCardProps {
  email: Email;
  onPress: (email: Email) => void;
  isSelected?: boolean;
}

export function EmailCard({ email, onPress, isSelected }: EmailCardProps) {
  const initials = getAvatarInitials(email.from.address, email.from.name);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !email.isRead && styles.unread,
        isSelected && styles.selected,
      ]}
      onPress={() => onPress(email)}
      activeOpacity={0.75}
    >
      {!email.isRead && <View style={styles.unreadBar} />}

      <Avatar initials={initials} seed={email.from.address} size="medium" />

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.sender, !email.isRead && styles.bold]} numberOfLines={1}>
            {email.from.name || email.from.address}
          </Text>
          <Text style={styles.time}>{formatRelativeDate(email.date)}</Text>
        </View>

        <Text style={[styles.subject, !email.isRead && styles.bold]} numberOfLines={1}>
          {email.subject || '(No subject)'}
        </Text>

        <Text style={styles.preview} numberOfLines={1}>
          {email.preview || '—'}
        </Text>
      </View>

      {email.hasAttachments && <Text style={styles.clip}>📎</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: 3,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unread: {
    backgroundColor: '#F5F3FF',
    borderColor: 'rgba(99,102,241,0.12)',
  },
  selected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
    ...shadows.cardHover,
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sender: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.secondary,
    marginRight: spacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: colors.primary,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    flexShrink: 0,
  },
  subject: {
    fontSize: fontSize.base,
    fontWeight: '400',
    color: colors.textMuted,
    marginBottom: 2,
  },
  preview: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  clip: {
    fontSize: 13,
    marginLeft: spacing.sm,
  },
});
