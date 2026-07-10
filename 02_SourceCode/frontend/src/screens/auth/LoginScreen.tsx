/**
 * LoginScreen - email/password login with gradient background.
 * Purple gradient header area with white form card below.
 * Includes a "Forgot password?" link that sends a reset email.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme/theme';
import { Button, Input, useToast } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import type { LoginScreenProps } from '@navigation/types';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn, resetPassword, loading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    const { error } = await signIn(email, password);
    if (error) {
      toast.show(error, 'error');
    } else {
      toast.show('Welcome back!', 'success');
    }
  };

  const handleForgotPassword = () => {
    // Prompt for the email to send the reset link to.
    if (!email.trim()) {
      toast.show(
        'Enter your email above first, then tap Forgot Password.',
        'info',
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.show('Enter a valid email above first.', 'error');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            const { error } = await resetPassword(email.trim());
            if (error) {
              toast.show(error, 'error');
            } else {
              toast.show(
                'Reset link sent! Check your email to reset your password.',
                'success',
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle='light-content'
        backgroundColor='transparent'
        translucent
      />

      <LinearGradient
        colors={[theme.colors.gradient.start, theme.colors.gradient.end]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name='chevron-back'
              size={26}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
        </View>

        {/* Title section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Log in to continue styling your wardrobe.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <View style={styles.form}>
            <Input
              label='Email'
              placeholder='you@example.com'
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((p) => ({ ...p, email: null }));
              }}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label='Password'
              placeholder='Enter your password'
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: null }));
              }}
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {/* Forgot password link */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <Button
              title='Log In'
              onPress={handleLogin}
              loading={loading}
              fullWidth
            />

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gradient.start,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: theme.spacing.xs,
  },
  formCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxxl,
    borderTopRightRadius: theme.radius.xxxl,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  form: {
    marginBottom: theme.spacing.md,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  forgotText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  actions: {
    marginTop: theme.spacing.sm,
  },
  signupBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  signupText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  signupLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
