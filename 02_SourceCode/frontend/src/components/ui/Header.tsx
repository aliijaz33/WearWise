/**
 * Header - screen title bar with optional back button and right action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  transparent: _transparent,
}: HeaderProps) {
  return (
    <View style={[styles.container, { paddingTop: theme.spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name='chevron-back' size={26} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightWrap}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rightWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
