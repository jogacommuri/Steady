import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ThemeColors } from './colors';

export type Theme = {
  colors: ThemeColors;
  dark: boolean;
};

/**
 * Resolve the active theme from the device colour scheme. Kept as a hook so
 * that when we add a manual light/dark override in Phase 4 it becomes the
 * single place to thread that state through.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    colors: dark ? darkTheme : lightTheme,
  };
}
