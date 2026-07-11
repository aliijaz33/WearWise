// Chip - selectable pill for tags (occasions, weather, styles, categories).

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@theme/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  selected = false,
  onPress,
  color,
  style,
  size = 'md',
}: ChipProps) {
  const accent = color ?? theme.colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.base,
        size === 'sm' && styles.sm,
        selected
          ? { backgroundColor: accent, borderColor: accent }
          : {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          selected
            ? { color: theme.colors.textInverse }
            : { color: theme.colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sm: {
    paddingVertical: theme.spacing.xs + 1,
    paddingHorizontal: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  textSm: {
    fontSize: theme.typography.sizes.xs,
  },
});
