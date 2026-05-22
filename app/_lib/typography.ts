import { Platform } from 'react-native';

/**
 * Unified Typography System
 * All font sizes, weights, and line heights are defined here
 * This ensures consistency across the entire app
 */

export const Typography = {
  // Display - Large headlines
  display: {
    lg: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    md: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    sm: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
  },

  // Heading - Section titles
  heading: {
    h1: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    h2: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.1,
    },
    h3: {
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 24,
      letterSpacing: 0.3,
    },
  },

  // Body - Content text
  body: {
    lg: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    md: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: 0.25,
    },
    sm: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
      letterSpacing: 0.4,
    },
    xs: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.3,
    },
  },

  // Subtitle - Secondary text
  subtitle: {
    lg: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: 0.1,
    },
    md: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    sm: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 18,
      letterSpacing: 0.1,
    },
  },

  // Caption - Small labels
  caption: {
    lg: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    md: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.3,
    },
    sm: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 0.2,
    },
  },

  // Button text
  button: {
    lg: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.5,
    },
    md: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    sm: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
  },

  // Overline - Uppercase labels
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

/**
 * Font Family Configuration
 * Set primary and secondary font families
 */
export const FontFamily = {
  // Primary font - for body text and most content
  primary: Platform.select({
    ios: 'Inter_400Regular',
    android: 'Inter_400Regular',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),

  // Primary bold
  primaryBold: Platform.select({
    ios: 'Inter_700Bold',
    android: 'Inter_700Bold',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),

  // Primary semibold
  primarySemiBold: Platform.select({
    ios: 'Inter_600SemiBold',
    android: 'Inter_600SemiBold',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),

  // Secondary font - for headlines (optional, can use Inter too)
  secondary: Platform.select({
    ios: 'Inter_400Regular',
    android: 'Inter_400Regular',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),

  // Secondary bold
  secondaryBold: Platform.select({
    ios: 'Inter_700Bold',
    android: 'Inter_700Bold',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
};

/**
 * Helper function to get complete text style
 * Usage: getTextStyle('heading.h1')
 */
export function getTextStyle(variant: string) {
  const parts = variant.split('.');
  const category = parts[0] as any;
  const size = parts[1] as any;

  const typographyObj = Typography as any;

  if (category === 'body' || category === 'subtitle' || category === 'caption') {
    return {
      ...(typographyObj[category]?.[size] || {}),
      fontFamily: FontFamily.primary,
    };
  } else if (category === 'heading' || category === 'display') {
    return {
      ...(typographyObj[category]?.[size] || {}),
      fontFamily: FontFamily.primaryBold,
    };
  } else if (category === 'button') {
    return {
      ...(typographyObj[category]?.[size] || {}),
      fontFamily: FontFamily.primarySemiBold,
    };
  }

  return typographyObj[category]?.[size] || {};
}
