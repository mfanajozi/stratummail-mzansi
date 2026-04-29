import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';

import { SetupScreen } from '../screens/SetupScreen';
import { AccountSelectScreen } from '../screens/AccountSelectScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { EmailViewScreen } from '../screens/EmailViewScreen';
import { ComposeScreen } from '../screens/ComposeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { useAccountsStore } from '../store';
import { colors, shadows, borderRadius } from '../theme';

const DESKTOP_BREAKPOINT = 900;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.bar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: tabStyles.label,
      }}
    >
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📥" /> }}
      />
      <Tab.Screen
        name="ComposeTab"
        component={InboxScreen}
        options={{
          tabBarLabel: 'Compose',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✏️" />,
          tabBarButton: (props) => (
            <TouchableOpacity {...props} style={tabStyles.fabWrap} activeOpacity={0.85}>
              <View style={tabStyles.fab}>
                <Text style={tabStyles.fabIcon}>+</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Compose'); },
        })}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="⚙️" /> }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { width } = useWindowDimensions();
  const { accounts, activeAccountId } = useAccountsStore();

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const hasAccounts = accounts.length > 0;
  // __setup__ is a sentinel used by AccountSelectScreen on desktop to trigger Setup
  const wantsSetup = activeAccountId === '__setup__';
  const isLoggedIn = hasAccounts && activeAccountId !== null && !wantsSetup;

  // ── Desktop ──────────────────────────────────────────────────────────────────
  if (isDesktop) {
    if (!hasAccounts || wantsSetup) {
      return (
        <SetupScreen
          navigation={{ replace: () => {}, navigate: () => {}, goBack: () => {} }}
        />
      );
    }
    if (!isLoggedIn) {
      return <AccountSelectScreen />;
    }
    return <DesktopLayout />;
  }

  // ── Mobile ───────────────────────────────────────────────────────────────────
  // React Navigation's auth-flow pattern: the screen set changes when auth state
  // changes, and the navigator transitions automatically.
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasAccounts || wantsSetup ? (
          // No accounts → Setup
          <>
            <Stack.Screen name="Setup" component={SetupScreen} />
          </>
        ) : !isLoggedIn ? (
          // Accounts exist but nobody is logged in → Account picker
          <>
            <Stack.Screen
              name="AccountSelect"
              component={AccountSelectScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="Setup" component={SetupScreen} />
          </>
        ) : (
          // Logged in → full app
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Inbox" component={InboxScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="EmailView" component={EmailViewScreen} />
            <Stack.Screen name="Compose" component={ComposeScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Setup" component={SetupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
    paddingBottom: 6,
    height: 62,
    ...shadows.card,
  },
  label: { fontSize: 11, fontWeight: '600' },
  iconWrap: { padding: 6, borderRadius: borderRadius.md },
  iconWrapActive: { backgroundColor: colors.accentLight },
  icon: { fontSize: 20 },
  iconActive: { transform: [{ scale: 1.1 }] },
  fabWrap: { top: -16, alignItems: 'center', justifyContent: 'center', width: 64 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', lineHeight: 30 },
});
