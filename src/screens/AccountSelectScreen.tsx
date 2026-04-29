import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccountsStore } from '../store';
import { Avatar, getAvatarInitials } from '../components/Avatar';
import { shadows, spacing, fontSize, borderRadius } from '../theme';

const GRADIENT: [string, string, string] = ['#7C3AED', '#3B82F6', '#06B6D4'];

interface Props {
  /** Passed by mobile navigator; undefined on desktop (no NavigationContainer). */
  navigation?: any;
}

export function AccountSelectScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  const { accounts, activeAccountId, setActiveAccount, logout } = useAccountsStore();

  const handleSelect = (accountId: string) => {
    setActiveAccount(accountId);
    // On mobile the navigator listens to store changes; no explicit navigate needed.
    // On desktop the AppNavigator re-renders directly from state.
  };

  const handleAddAccount = () => {
    if (navigation) {
      navigation.navigate('Setup');
    } else {
      // Desktop: set activeAccountId to a sentinel that AppNavigator maps to Setup
      // Simplest: expose a flag or just let the user see AppNavigator picks Setup
      // We'll use a dedicated action or the existing flow — navigate via store signal
      useAccountsStore.setState({ activeAccountId: '__setup__' });
    }
  };

  return (
    <LinearGradient colors={GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <ScrollView
          contentContainerStyle={[s.scroll, isWide && s.scrollWide]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.hero}>
            <Image
              source={require('../../assets/splash-icon.png')}
              style={[s.logo, isWide && s.logoWide]}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={[s.card, isWide && s.cardWide]}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <Text style={s.cardSub}>Choose an account to continue</Text>

            {/* Account list */}
            <View style={s.accountList}>
              {accounts.map((account) => {
                const isActive = account.id === activeAccountId;
                const initials = getAvatarInitials(account.email, account.displayName);
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[s.accountRow, isActive && s.accountRowActive]}
                    onPress={() => handleSelect(account.id)}
                    activeOpacity={0.8}
                  >
                    <Avatar
                      initials={initials}
                      seed={account.email}
                      size="large"
                    />
                    <View style={s.accountInfo}>
                      <Text style={s.accountName}>{account.displayName}</Text>
                      <Text style={s.accountEmail}>{account.email}</Text>
                    </View>
                    <View style={s.accountArrow}>
                      {isActive ? (
                        <View style={s.activeIndicator}>
                          <Text style={s.activeIndicatorText}>Active</Text>
                        </View>
                      ) : (
                        <Text style={s.arrowIcon}>›</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add account */}
            <TouchableOpacity style={s.addBtn} onPress={handleAddAccount}>
              <Text style={s.addBtnIcon}>+</Text>
              <Text style={s.addBtnText}>Use another account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  scrollWide: { justifyContent: 'center', paddingVertical: spacing.xxl },

  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  logo: { width: 140, height: 140 },
  logoWide: { width: 160, height: 160 },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.floating,
  },
  cardWide: { maxWidth: 460, alignSelf: 'center' },

  cardTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontSize: fontSize.base,
    color: '#64748B',
    marginBottom: spacing.xl,
  },

  accountList: { gap: spacing.sm, marginBottom: spacing.lg },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.card,
  },
  accountRowActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },

  accountInfo: { flex: 1, marginLeft: spacing.md },
  accountName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  accountEmail: {
    fontSize: fontSize.sm,
    color: '#64748B',
    marginTop: 2,
  },

  accountArrow: { marginLeft: spacing.md, alignItems: 'center' },
  arrowIcon: { fontSize: 24, color: '#6366F1', fontWeight: '300' },

  activeIndicator: {
    backgroundColor: '#6366F1',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  activeIndicatorText: {
    fontSize: fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  addBtnIcon: { fontSize: 18, color: '#6366F1', marginRight: spacing.sm },
  addBtnText: { fontSize: fontSize.base, fontWeight: '600', color: '#6366F1' },
});
