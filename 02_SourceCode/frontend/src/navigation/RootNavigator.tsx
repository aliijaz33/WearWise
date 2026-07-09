/**
 * RootNavigator - auth gate.
 * Shows Auth stack while initializing or unauthenticated,
 * Main stack once a session exists.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuth } from '@context/AuthContext';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { theme } from '@theme/theme';

export function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
