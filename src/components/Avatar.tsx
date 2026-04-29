import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { stringToAvatarColor } from '../theme';

interface AvatarProps {
  initials: string;
  seed?: string;
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
}

export function Avatar({ initials, seed, size = 'medium', bgColor }: AvatarProps) {
  const sizeMap = {
    small:  { width: 32, height: 32, fontSize: 12, borderRadius: 8 },
    medium: { width: 44, height: 44, fontSize: 16, borderRadius: 11 },
    large:  { width: 52, height: 52, fontSize: 18, borderRadius: 14 },
  };

  const s = sizeMap[size];
  const bg = bgColor ?? stringToAvatarColor(seed ?? initials);

  return (
    <View style={[styles.base, { width: s.width, height: s.height, borderRadius: s.borderRadius, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize: s.fontSize }]}>{initials}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function getAvatarInitials(email: string, displayName?: string): string {
  if (displayName && displayName.trim()) return getInitials(displayName);
  return getInitials(email.split('@')[0]);
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
