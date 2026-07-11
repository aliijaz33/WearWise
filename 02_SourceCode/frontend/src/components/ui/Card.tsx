// Card - rounded surface with soft shadow.

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '@theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg' | 'none';
  padded?: boolean;
}

export function Card({
  children,
  style,
  elevation = 'sm',
  padded = true,
}: CardProps) {
  const shadow = elevation === 'none' ? null : theme.shadows[elevation];

  return (
    <View style={[styles.card, shadow, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  padded: {
    padding: theme.spacing.lg,
  },
});
