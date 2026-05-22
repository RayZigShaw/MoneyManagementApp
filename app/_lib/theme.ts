import { MD3LightTheme } from 'react-native-paper';
import { FontFamily, Typography } from './typography';

/**
 * Custom theme for react-native-paper with unified typography
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    tertiary: '#0ea5e9',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
  },
  fonts: {
    displayLarge: {
      ...Typography.display.lg,
      fontFamily: FontFamily.primaryBold,
    },
    displayMedium: {
      ...Typography.display.md,
      fontFamily: FontFamily.primaryBold,
    },
    displaySmall: {
      ...Typography.display.sm,
      fontFamily: FontFamily.primaryBold,
    },
    headlineLarge: {
      ...Typography.heading.h1,
      fontFamily: FontFamily.primaryBold,
    },
    headlineMedium: {
      ...Typography.heading.h2,
      fontFamily: FontFamily.primaryBold,
    },
    headlineSmall: {
      ...Typography.heading.h3,
      fontFamily: FontFamily.primaryBold,
    },
    titleLarge: {
      ...Typography.heading.h4,
      fontFamily: FontFamily.primaryBold,
    },
    titleMedium: {
      ...Typography.subtitle.lg,
      fontFamily: FontFamily.primarySemiBold,
    },
    titleSmall: {
      ...Typography.subtitle.md,
      fontFamily: FontFamily.primarySemiBold,
    },
    bodyLarge: {
      ...Typography.body.lg,
      fontFamily: FontFamily.primary,
    },
    bodyMedium: {
      ...Typography.body.md,
      fontFamily: FontFamily.primary,
    },
    bodySmall: {
      ...Typography.body.sm,
      fontFamily: FontFamily.primary,
    },
    labelLarge: {
      ...Typography.button.lg,
      fontFamily: FontFamily.primarySemiBold,
    },
    labelMedium: {
      ...Typography.button.md,
      fontFamily: FontFamily.primarySemiBold,
    },
    labelSmall: {
      ...Typography.button.sm,
      fontFamily: FontFamily.primarySemiBold,
    },
  },
};

/**
 * Color palette for easy access
 */
export const Colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  tertiary: '#0ea5e9',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  border: '#e2e8f0',
  divider: '#e2e8f0',
};

/**
 * Spacing system
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/**
 * Border radius
 */
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Shadow (elevation)
 */
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};
