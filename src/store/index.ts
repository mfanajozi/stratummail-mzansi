import { create } from 'zustand';
import { Account, Email, Folder, Signature } from '../types';

// ── Accounts ───────────────────────────────────────────────────────────────────

interface AccountsState {
  accounts: Account[];
  activeAccountId: string | null;
  isLoading: boolean;
  error: string | null;
  addAccount: (account: Account) => void;
  loadAccounts: (accounts: Account[], preserveActiveId?: string | null) => void;
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string) => void;
  setDefaultAccount: (id: string) => void;
  updateDisplayName: (id: string, displayName: string) => void;
  logout: () => void;
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  activeAccountId: null,
  isLoading: false,
  error: null,

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
      activeAccountId: account.id,
    })),

  loadAccounts: (loaded, preserveActiveId) =>
    set(() => ({
      accounts: loaded,
      activeAccountId:
        preserveActiveId !== undefined
          ? preserveActiveId
          : loaded.find((a) => a.isDefault)?.id ?? loaded[0]?.id ?? null,
    })),

  logout: () => set({ activeAccountId: null }),

  removeAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      activeAccountId:
        state.activeAccountId === id
          ? state.accounts.find((a) => a.id !== id)?.id ?? null
          : state.activeAccountId,
    })),

  setActiveAccount: (id) => set({ activeAccountId: id }),

  setDefaultAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((a) => ({ ...a, isDefault: a.id === id })),
    })),

  updateDisplayName: (id, displayName) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, displayName } : a
      ),
    })),
}));

// ── Emails ─────────────────────────────────────────────────────────────────────

interface EmailsState {
  emails: Record<string, Email[]>;
  folders: Record<string, Folder[]>;
  selectedEmail: Email | null;
  isLoading: boolean;
  error: string | null;
  setEmails: (accountId: string, emails: Email[]) => void;
  addEmail: (accountId: string, email: Email) => void;
  markAsRead: (accountId: string, emailId: string) => void;
  markAsUnread: (accountId: string, emailId: string) => void;
  deleteEmail: (accountId: string, emailId: string) => void;
  setSelectedEmail: (email: Email | null) => void;
  setFolders: (accountId: string, folders: Folder[]) => void;
}

export const useEmailsStore = create<EmailsState>((set) => ({
  emails: {},
  folders: {},
  selectedEmail: null,
  isLoading: false,
  error: null,

  setEmails: (accountId, emails) =>
    set((state) => ({ emails: { ...state.emails, [accountId]: emails } })),

  addEmail: (accountId, email) =>
    set((state) => ({
      emails: {
        ...state.emails,
        [accountId]: [email, ...(state.emails[accountId] || [])],
      },
    })),

  markAsRead: (accountId, emailId) =>
    set((state) => ({
      emails: {
        ...state.emails,
        [accountId]: (state.emails[accountId] || []).map((e) =>
          e.id === emailId ? { ...e, isRead: true } : e
        ),
      },
      selectedEmail:
        state.selectedEmail?.id === emailId
          ? { ...state.selectedEmail, isRead: true }
          : state.selectedEmail,
    })),

  markAsUnread: (accountId, emailId) =>
    set((state) => ({
      emails: {
        ...state.emails,
        [accountId]: (state.emails[accountId] || []).map((e) =>
          e.id === emailId ? { ...e, isRead: false } : e
        ),
      },
    })),

  deleteEmail: (accountId, emailId) =>
    set((state) => ({
      emails: {
        ...state.emails,
        [accountId]: (state.emails[accountId] || []).filter(
          (e) => e.id !== emailId
        ),
      },
      selectedEmail:
        state.selectedEmail?.id === emailId ? null : state.selectedEmail,
    })),

  setSelectedEmail: (email) => set({ selectedEmail: email }),

  setFolders: (accountId, folders) =>
    set((state) => ({ folders: { ...state.folders, [accountId]: folders } })),
}));

// ── Signatures ─────────────────────────────────────────────────────────────────

interface SignaturesState {
  signatures: Record<string, Signature>;
  isLoading: boolean;
  setSignature: (accountId: string, signature: Signature) => void;
  removeSignature: (accountId: string) => void;
}

export const useSignaturesStore = create<SignaturesState>((set) => ({
  signatures: {},
  isLoading: false,
  setSignature: (accountId, signature) =>
    set((state) => ({
      signatures: { ...state.signatures, [accountId]: signature },
    })),
  removeSignature: (accountId) =>
    set((state) => {
      const next = { ...state.signatures };
      delete next[accountId];
      return { signatures: next };
    }),
}));

// ── UI ─────────────────────────────────────────────────────────────────────────

interface UIState {
  isComposeModalVisible: boolean;
  isSidebarOpen: boolean;
  currentFolder: string;
  setComposeModalVisible: (visible: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentFolder: (folder: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isComposeModalVisible: false,
  isSidebarOpen: false,
  currentFolder: 'INBOX',
  setComposeModalVisible: (visible) => set({ isComposeModalVisible: visible }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
}));
