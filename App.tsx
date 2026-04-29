import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAccountsStore, useSignaturesStore } from './src/store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

// ── localStorage helpers (web only, silently no-op elsewhere) ──────────────────

const LS_ACCOUNTS   = 'stratummail-accounts-v1';
const LS_SIGNATURES = 'stratummail-signatures-v1';

function lsGet<T>(key: string): T | null {
  if (Platform.OS !== 'web') return null;
  try {
    const v = (globalThis as any).localStorage?.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

function lsSet(key: string, value: unknown): void {
  if (Platform.OS !== 'web') return;
  try { (globalThis as any).localStorage?.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Persistence layer ──────────────────────────────────────────────────────────
// Sits inside the provider tree so it can read Zustand stores.

function StorePersistence() {
  const { accounts, activeAccountId } = useAccountsStore();
  const { signatures } = useSignaturesStore();

  // Write accounts to localStorage whenever they change
  useEffect(() => {
    if (accounts.length > 0) {
      lsSet(LS_ACCOUNTS, { accounts, activeAccountId });
    }
  }, [accounts, activeAccountId]);

  // Write signatures to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(signatures).length > 0) {
      lsSet(LS_SIGNATURES, signatures);
    }
  }, [signatures]);

  return null;
}

// ── Account bootstrap ──────────────────────────────────────────────────────────
// 1. Load from localStorage immediately (zero latency on refresh).
// 2. Sync with backend in background to pick up any server-side changes.

function AccountBootstrap({ children }: { children: React.ReactNode }) {
  const { accounts, loadAccounts } = useAccountsStore();
  const { setSignature } = useSignaturesStore();

  // If localStorage already gave us accounts, start ready so there's no flash.
  const [ready, setReady] = useState(accounts.length > 0);

  useEffect(() => {
    let cancelled = false;

    // ── Step 1: restore from localStorage (synchronous, instant) ──────────────
    const cached = lsGet<{ accounts: any[]; activeAccountId: string | null }>(LS_ACCOUNTS);
    if (cached?.accounts?.length) {
      // Pass activeAccountId explicitly so logout state (null) is preserved
      loadAccounts(cached.accounts, cached.activeAccountId ?? null);
    }

    const cachedSigs = lsGet<Record<string, any>>(LS_SIGNATURES);
    if (cachedSigs) {
      Object.entries(cachedSigs).forEach(([accountId, sig]) =>
        setSignature(accountId, sig as any)
      );
    }

    // Show the app immediately if we had anything cached
    if (cached?.accounts?.length) {
      setReady(true);
    }

    // ── Step 2: sync with backend (async, background) ──────────────────────────
    fetch(`${API_URL}/accounts`)
      .then((r) => (r.ok ? r.json() : []))
      .then((serverAccounts: any[]) => {
        if (!cancelled && Array.isArray(serverAccounts) && serverAccounts.length > 0) {
          // Preserve whichever activeAccountId is already set (including null = logged out)
          const { activeAccountId: currentActive } = useAccountsStore.getState();
          loadAccounts(serverAccounts, currentActive);
        }
      })
      .catch(() => { /* server offline — localStorage data is used */ })
      .finally(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <>{children}</>;
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AccountBootstrap>
          <StorePersistence />
          <AppNavigator />
        </AccountBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
