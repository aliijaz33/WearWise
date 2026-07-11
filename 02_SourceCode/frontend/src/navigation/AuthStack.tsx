// AuthStack - Welcome, Login, Signup screens.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WelcomeScreen } from '@screens/auth/WelcomeScreen';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { SignupScreen } from '@screens/auth/SignupScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName='Welcome'
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name='Welcome' component={WelcomeScreen} />
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='Signup' component={SignupScreen} />
    </Stack.Navigator>
  );
}
