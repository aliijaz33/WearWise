import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@context/AuthContext';
import { ToastProvider } from '@components/ui';
import { RootNavigator } from '@navigation/RootNavigator';
import { theme } from '@theme/theme';

export default function App() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style='dark' />
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
