import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface AvatarProps {
  initials: string;
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
}

export function Avatar({ 
  initials, 
  size = 'medium', 
  bgColor = colors.accent 
}: AvatarProps) {
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: 12 },
    medium: { width: 44, height: 44, fontSize: 16 },
    large: { width: 56, height: 56, fontSize: 20 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: currentSize.fontSize }]}>
        {initials}
      </Text>
    </View>
  );
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function getAvatarInitials(email: string, displayName?: string): string {
  if (displayName) {
    return getInitials(displayName);
  }
  return getInitials(email.split('@')[0]);
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.surface,
    fontWeight: '600',
  },
});