/**
 * WelcomeScreen - first screen on load.
 * Full-screen purple gradient with the WearWise logo, tagline,
 * a white "Get Started" button, and a "Login" link.
 * Design per guideforyou.js LoginScreenSpec.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@theme/theme';
import type { WelcomeScreenProps } from '@navigation/types';

const { width, height } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
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
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode='contain'
              />
            </View>
            <Text style={styles.logoText}>WearWise</Text>
            <Text style={styles.tagline}>Smart Outfits for Every Occasion</Text>
          </View>

          {/* Bottom Buttons Section */}
          <View style={styles.bottomContainer}>
            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.getStartedButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.6}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginHighlight}>Login</Text>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxxl,
    paddingVertical: theme.spacing.huge,
  },
  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginTop:
      height > 667
        ? theme.spacing.huge + theme.spacing.huge
        : theme.spacing.huge,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  logo: {
    width: 90,
    height: 90,
  },
  logoText: {
    fontSize:
      width > 375
        ? theme.typography.sizes.massive
        : theme.typography.sizes.huge,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textInverse,
    letterSpacing: theme.typography.letterSpacing.wider,
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: theme.typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Bottom Section
  bottomContainer: {
    width: '100%',
    gap: theme.spacing.lg,
  },
  // Get Started Button
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  getStartedText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.3,
  },
  // Login Link
  loginButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.regular,
  },
  loginHighlight: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.semibold,
    textDecorationLine: 'underline',
  },
});
