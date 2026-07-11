// Button - primary brand button with variants.

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '@theme/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyle = styles[variant];
  const variantTextStyle = textStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTextStyle.color} size='small' />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variantTextStyle, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.button,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  secondary: {
    backgroundColor: theme.colors.primarySoft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
});

const textStyles = StyleSheet.create({
  primary: { color: theme.colors.textInverse },
  secondary: { color: theme.colors.primaryDark },
  outline: { color: theme.colors.primary },
  ghost: { color: theme.colors.primary },
  danger: { color: theme.colors.textInverse },
});
