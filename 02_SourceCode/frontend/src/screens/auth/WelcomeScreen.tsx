// WelcomeScreen - first screen on load.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@theme/theme';
import type { WelcomeScreenProps } from '@navigation/types';

const { width } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor='transparent' translucent />

      {/* Full-screen background image — shown directly, no gradient overlay. */}
      <ImageBackground
        source={require('../../../assets/images/background.jpeg')}
        style={styles.background}
        resizeMode='cover'
      >
        {/* Branding section — hanger image + wordmark + tagline */}
        <View style={styles.branding}>
          <View style={styles.hangerWrap}>
            <Image
              source={require('../../../assets/icons/hanger.png')}
              style={styles.hangerImage}
              resizeMode='cover'
            />
          </View>

          <Text style={styles.logoText}>WearWise</Text>
          <Text style={styles.tagline}>Smart Outfits for Every Occasion</Text>
        </View>

        {/* White bottom controller card — anchors to the very bottom edge */}
        <View style={styles.bottomCard}>
          {/* Get Started — solid vibrant brand purple */}
          <TouchableOpacity
            style={styles.getStartedButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          {/* Login row */}
          <TouchableOpacity
            style={styles.loginRow}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  branding: {
    alignItems: 'center',
    marginTop: '10%',
    paddingHorizontal: '16.5%',
  },
  // Circular frame around the hanger photo.
  hangerWrap: {
    width: 200,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangerImage: {
    width: '100%',
    height: '100%',
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
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.medium,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed(theme.typography.sizes.lg),
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.xxxl,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // White bottom panel — anchors to the bottom edge of the screen.
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.xxxl,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  // Get Started — solid vibrant brand purple fill.
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.3,
  },
  // Login row — directly below the purple button.
  loginRow: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
  },
  loginHighlight: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
