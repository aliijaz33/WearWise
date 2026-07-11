/**
 * RootNavigator - auth gate.
 *
 * Shows the custom animated SplashScreen while initializing (and for a minimum
 * of 2 seconds), then routes to the Auth stack (not logged in) or the Main
 * stack (already logged in) once the Supabase session has resolved.
 */

import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '@context/AuthContext';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { SplashScreen } from '@components/ui';

export function RootNavigator() {
  const { session, initializing } = useAuth();
  // The splash stays visible until the session has resolved AND the minimum
  // 2-second duration has elapsed. `showSplash` flips to false only after both.
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    // `ready` becomes true once Supabase session init finishes. The splash
    // itself enforces the 2-second minimum, so we pass `!initializing`.
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
