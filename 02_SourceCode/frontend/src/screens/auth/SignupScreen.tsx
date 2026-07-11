// SignupScreen - register a new account with gradient background.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@theme/theme';
import { Button, Input, useToast } from '@components/ui';
import { useAuth } from '@context/AuthContext';
import type { SignupScreenProps } from '@navigation/types';

export function SignupScreen({ navigation }: SignupScreenProps) {
  const { signUp, loading } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string | null;
    email?: string | null;
    password?: string | null;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast.show(error, 'error');
    } else {
      // Clear the form fields so they don't linger after navigation.
      setFullName('');
      setEmail('');
      setPassword('');
      setErrors({});
      toast.show('Account created! Please log in to continue.', 'success');
      // Navigate to the Login screen so the user can sign in directly.
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join WearWise and start building smarter outfits.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <View style={styles.form}>
            <Input
              label='Full Name'
              placeholder='Your name'
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName)
                  setErrors((p) => ({ ...p, fullName: null }));
              }}
              autoCapitalize='words'
              error={errors.fullName}
            />
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
              placeholder='At least 6 characters'
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
          </View>

          <View style={styles.actions}>
            <Button
              title='Sign Up'
              onPress={handleSignup}
              loading={loading}
              fullWidth
            />
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>Log In</Text>
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
    paddingBottom: theme.spacing.xxxl,
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
  actions: {
    marginTop: theme.spacing.sm,
  },
  loginBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  loginText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
