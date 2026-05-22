import React, { createContext, useContext, useEffect, useState } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeStorage } from '../_services/_safe-storage';
import { FontFamily, Typography } from './typography';

const lightColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  tertiary: '#0ea5e9',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
};

const darkColors = {
  primary: '#818cf8',
  secondary: '#a78bfa',
  tertiary: '#38bdf8',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceVariant: '#334155',
};

const createTheme = (isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const colors = isDark ? darkColors : lightColors;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...colors,
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
        ...Typography.subtitle.md,
        fontFamily: FontFamily.primarySemiBold,
      },
      titleSmall: {
        ...Typography.subtitle.sm,
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
        ...Typography.caption.md,
        fontFamily: FontFamily.primarySemiBold,
      },
      labelMedium: {
        ...Typography.caption.sm,
        fontFamily: FontFamily.primarySemiBold,
      },
      labelSmall: {
        ...Typography.caption.xs,
        fontFamily: FontFamily.primarySemiBold,
      },
    },
  };
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  theme: any;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(() => createTheme(false));

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await SafeStorage.getItem('theme_dark_mode');
        const isDark = saved === 'true';
        setIsDarkMode(isDark);
        setTheme(createTheme(isDark));
      } catch (e) {
        console.error('Error loading theme preference:', e);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      setTheme(createTheme(newValue));
      await SafeStorage.setItem('theme_dark_mode', String(newValue));
    } catch (e) {
      console.error('Error toggling theme:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
