// Screen - base screen wrapper with safe area + scroll + background.

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  keyboardAware = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.inner, contentContainerStyle]}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      {children}
    </ScrollView>
  ) : (
    content
  );

  if (keyboardAware) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, style]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {body}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }, style]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxxl,
  },
});
