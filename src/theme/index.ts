export const colors = {
  // Backgrounds
  background: '#F1F5FF',
  surface: '#FFFFFF',

  // Sidebar
  sidebarBg: '#1A1756',
  sidebarText: '#A5B4FC',
  sidebarTextActive: '#FFFFFF',
  sidebarActiveBg: 'rgba(99, 102, 241, 0.28)',
  sidebarHoverBg: 'rgba(99, 102, 241, 0.12)',

  // Accent
  accent: '#6366F1',
  accentDark: '#4F46E5',
  accentLight: '#EEF2FF',
  accentGlow: 'rgba(99, 102, 241, 0.25)',

  // Text
  primary: '#0F172A',
  secondary: '#475569',
  textMuted: '#64748B',
  textLight: '#94A3B8',

  // Status
  unread: '#6366F1',
  gold: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',

  // Borders
  divider: '#E2E8F0',
  dividerLight: '#F1F5FF',
};

export const shadows = {
  card: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 6,
  },
  sidebar: {
    shadowColor: '#1A1756',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 17,
  xxl: 22,
  xxxl: 28,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Avatar palette — each sender gets a consistent color
export const avatarColors = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
  '#84CC16', '#F97316',
];

export function stringToAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default { colors, spacing, fontSize, borderRadius, shadows };
