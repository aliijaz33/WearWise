// RootNavigator - auth gate: shows splash, then routes to Auth or Main stack.

import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '@context/AuthContext';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { SplashScreen } from '@components/ui';

export function RootNavigator() {
  const { session, initializing } = useAuth();
  // Splash stays visible until session resolves AND the 2-second minimum elapses.
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    // `ready` becomes true once Supabase session init finishes.
    return (
      <SplashScreen
        ready={!initializing}
        minDuration={2000}
        onComplete={handleSplashComplete}
      />
    );
  }

  return (
    <NavigationContainer>
      {session ? <RootStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
