/**
 * SplashScreen - custom animated splash with a pulsing logo.
 *
 * Behaviour:
 *   • Shows the WearWise logo centered on the app background.
 *  • The logo continuously pulses (scales 1 → 0.85 → 1) in a slow, smooth,
 *    breathing/heartbeat loop using react-native-reanimated.
 *  • Stays mounted for at least `minDuration` ms (default 2000) AND until the
 *    `ready` prop becomes true (i.e. the Supabase session has resolved).
 *  • When both conditions are met, calls `onComplete` so the parent can
 *    navigate to the Auth stack (not logged in) or the Main stack (logged in).
 *
 * Animation cleanup:
 *  The reanimated `withRepeat` runs on the UI thread. We cancel it on unmount
 *  by calling `cancelAnimation(scale)` in the cleanup of useEffect, so the
 *  animation never leaks or runs after the screen is gone.
 *
 * Logo source:
 *  The image lives at `assets/images/logo.png` and is referenced here via a
 *  relative require. To swap the logo, replace that file (keep the same name)
 *  or point `LOGO` at a new path.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import { theme } from '@theme/theme';

// ---- Logo source -----------------------------------------------------------
// Place your logo at `assets/images/logo.png` (relative to the project root).
// To use a different image, either overwrite that file or change the path
// below. The image is displayed with `resizeMode="contain"` so the whole logo
// is always visible regardless of aspect ratio.
const LOGO: ImageSourcePropType = require('../../../assets/images/logo.png');

interface SplashScreenProps {
  /** Becomes true once the async work (e.g. Supabase session) has resolved. */
  ready: boolean;
  /** Minimum time (ms) the splash stays visible. Default 2000. */
  minDuration?: number;
  /** Called once both `ready` is true and `minDuration` has elapsed. */
  onComplete: () => void;
}

export function SplashScreen({
  ready,
  minDuration = 2000,
  onComplete,
}: SplashScreenProps) {
  // ---- Pulse animation -----------------------------------------------------
  // scale gently moves 1 → 0.85 → 1 in a slow, smooth loop.
  const scale = useSharedValue(1);

  useEffect(() => {
    // Slow breathing/heartbeat: 900ms shrink + 900ms expand = 1.8s per cycle.
    // Easing.inOut(Easing.ease) gives a soft, organic ease on both directions.
    scale.value = withRepeat(
      withSequence(
        withTiming(0.85, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1, // infinite repetitions
      false, // don't reverse the sequence each iteration
    );

    // Cleanup: stop the animation when the splash unmounts so it never leaks.
    return () => {
      cancelAnimation(scale);
    };
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // ---- Minimum-duration gate ----------------------------------------------
  const [minElapsed, setMinElapsed] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  // Fire onComplete exactly once, only after BOTH conditions are true.
  useEffect(() => {
    if (ready && minElapsed && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [ready, minElapsed, onComplete]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={LOGO}
        style={[styles.logo, animatedStyle]}
        resizeMode='contain'
        accessible
        accessibilityLabel='WearWise logo'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  logo: {
    // Wide logo (2:1). Cap the width so it fits comfortably on screen and let
    // the height follow from the aspect ratio via resizeMode="contain".
    width: '70%',
    maxWidth: 320,
    height: 180,
  },
});
