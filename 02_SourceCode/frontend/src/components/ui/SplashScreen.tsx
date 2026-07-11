// SplashScreen - custom animated splash with a pulsing logo (min duration + ready gate).

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ImageSourcePropType } from 'react-native';
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

// Logo source: assets/images/logo.png (resizeMode="contain").
const LOGO: ImageSourcePropType = require('../../../assets/images/logo.png');

interface SplashScreenProps {
  ready: boolean; // true once async work (e.g. Supabase session) has resolved
  minDuration?: number; // minimum time (ms) the splash stays visible (default 2000)
  onComplete: () => void; // called once both `ready` is true and `minDuration` has elapsed
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
