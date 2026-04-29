import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmailsStore } from '../store';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { EmailBodyView } from '../components/EmailBodyView';
import { formatFullDate } from '../utils/dateUtils';
import { colors, shadows, spacing, fontSize, borderRadius } from '../theme';

export function EmailViewScreen({ route, navigation }: any) {
  const { selectedEmail } = useEmailsStore();
  const email = selectedEmail;

  if (!email) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={s.centerText}>Email not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = getAvatarInitials(email.from.address, email.from.name);
  const toList = Array.isArray(email.to) ? email.to.join(', ') : String(email.to || '');

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Compose', { replyTo: email })}>
            <Text style={s.actionIcon}>↩</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Compose', { forward: email })}>
            <Text style={s.actionIcon}>↪</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>☆</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Text style={s.actionIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Subject */}
        <Text style={s.subject}>{email.subject || '(No subject)'}</Text>

        {/* Sender card */}
        <View style={s.senderCard}>
          <Avatar initials={initials} seed={email.from.address} size="medium" />
          <View style={s.senderInfo}>
            <Text style={s.senderName}>{email.from.name || email.from.address}</Text>
            <Text style={s.senderEmail}>{email.from.address}</Text>
            {toList ? <Text style={s.toLine}>To: {toList}</Text> : null}
          </View>
          <Text style={s.date}>{formatFullDate(email.date)}</Text>
        </View>

        {/* Email body — renders HTML or plain text properly */}
        <View style={s.bodyWrap}>
          <EmailBodyView body={email.body || email.preview || ''} autoHeight />
        </View>
      </ScrollView>

      {/* ── Reply bar ── */}
      <View style={s.replyBar}>
        <TouchableOpacity style={s.replyBtn} onPress={() => navigation.navigate('Compose', { replyTo: email })}>
          <Text style={s.replyBtnIcon}>↩</Text>
          <Text style={s.replyBtnText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.replyBtn} onPress={() => navigation.navigate('Compose', { forward: email })}>
          <Text style={s.replyBtnIcon}>↪</Text>
          <Text style={s.replyBtnText}>Forward</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerText: { fontSize: fontSize.lg, color: colors.secondary },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider, ...shadows.card,
  },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, color: colors.accent },
  headerActions: { flexDirection: 'row' },
  actionBtn: { padding: spacing.sm, marginLeft: spacing.xs },
  actionIcon: { fontSize: 20, color: colors.secondary },

  scroll: { flex: 1 },

  subject: {
    fontSize: 20, fontWeight: '800', color: colors.primary,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md,
    lineHeight: 28,
  },

  senderCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.background, borderRadius: borderRadius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.divider, ...shadows.card,
  },
  senderInfo: { flex: 1, marginLeft: spacing.md },
  senderName: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary },
  senderEmail: { fontSize: fontSize.sm, color: colors.secondary, marginTop: 2 },
  toLine: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: fontSize.xs, color: colors.textLight, marginLeft: spacing.sm, textAlign: 'right' },

  bodyWrap: { paddingHorizontal: spacing.lg, paddingBottom: 24 },

  replyBar: {
    flexDirection: 'row', justifyContent: 'center',
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider,
    backgroundColor: colors.surface, gap: spacing.md,
  },
  replyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentLight, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: borderRadius.full, gap: spacing.sm,
  },
  replyBtnIcon: { fontSize: 16, color: colors.accent },
  replyBtnText: { fontSize: fontSize.base, fontWeight: '600', color: colors.accent },
});
