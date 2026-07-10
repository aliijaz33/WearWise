/**
 * WearWise Theme
 * Client-extracted palette: vibrant royal purple (#5D38F5) primary, deep
 * purple-navy (#1E1145) headers, soft lavender (#A390F9) accents, light
 * lavender-gray (#F7F5FF) panels. Aligned with the WearWise design system.
 */

export const colors = {
  // Brand – vibrant royal purple (buttons, active icons, highlight text)
  primary: '#5D38F5',
  primaryDark: '#4A2BD4',
  primaryLight: '#A390F9', // soft lavender (borders, inactive icons, accents)
  primarySoft: '#F7F5FF', // light lavender-gray (panel backgrounds)
  primarySofter: '#FBFAFF',

  // Accents – pink secondary
  accent: '#FF6B8A',
  accentLight: '#FF9BB0',
  accentDark: '#E54A6E',
  accentSoft: '#FFE8EE',
  accentWarm: '#FF9500',

  // Neutrals
  background: '#FFFFFF', // pure white app background
  surface: '#FFFFFF',
  surfaceAlt: '#F7F5FF',
  border: '#E8E5F5',
  divider: '#E5E5EA',

  // Text
  text: '#1E1145', // deep purple-navy (main headers & names)
  textSecondary: '#7A7585', // muted gray w/ purple undertone (subtitles)
  textMuted: '#B0ACBF',
  textInverse: '#FFFFFF',
  textLink: '#5D38F5',

  // Feedback
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Gradient (login / welcome screens)
  gradient: {
    start: '#5D38F5',
    end: '#A390F9',
  },

  // Category colors – aligned with new palette
  category: {
    tops: '#5D38F5',
    bottoms: '#007AFF',
    dresses: '#FF6B8A',
    shoes: '#FF9500',
    bags: '#34C759',
    accessories: '#A390F9',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 56,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  xxxl: 20,
  pill: 9999,
  button: 10,
  card: 10,
  input: 8,
  image: 8,
  avatar: 20,
  chip: 8,
  tab: 10,
} as const;

export const typography = {
  // Font families - using system fonts for cross-platform consistency
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    light: 'System',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
    huge: 40,
    massive: 48,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  // React Native's `lineHeight` style expects an ABSOLUTE pixel value, not a
  // CSS-style multiplier. These helpers accept a fontSize and return the
  // correct absolute lineHeight so text never gets clipped to a few pixels.
  lineHeights: {
    tight: (fontSize: number) => Math.round(fontSize * 1.2),
    normal: (fontSize: number) => Math.round(fontSize * 1.4),
    relaxed: (fontSize: number) => Math.round(fontSize * 1.6),
    loose: (fontSize: number) => Math.round(fontSize * 2.0),
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
  },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: 'rgba(93, 56, 245, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(93, 56, 245, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(93, 56, 245, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#5D38F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
