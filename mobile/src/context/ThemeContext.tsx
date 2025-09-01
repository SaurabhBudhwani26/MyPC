import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  shadow: string;
  overlay: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#1E40AF',
    primaryDark: '#1E3A8A',
    secondary: '#0369A1',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#1E40AF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#1E40AF',
    primaryDark: '#1E3A8A',
    secondary: '#0369A1',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#334155',
    borderLight: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#1E40AF',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize theme based on system preference
    const colorScheme = Appearance.getColorScheme();
    setIsDark(colorScheme === 'dark');

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: any }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
