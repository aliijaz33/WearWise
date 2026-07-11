// Loading - centered spinner with optional label.

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '@theme/theme';

interface LoadingProps {
  label?: string;
  fullscreen?: boolean;
}

export function Loading({ label, fullscreen = false }: LoadingProps) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size='large' color={theme.colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
  },
  label: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
});
