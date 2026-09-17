import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ThemeColors } from './colors';

export type Theme = {
  colors: ThemeColors;
  dark: boolean;
};

/**
 * The app is currently pinned to the light theme. The dark palette and the
 * device-scheme logic below are kept intact — flip FORCE_LIGHT to false to
 * restore automatic light/dark (also set `userInterfaceStyle` back to
 * "automatic" in app.json).
 */
const FORCE_LIGHT = true;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = FORCE_LIGHT ? false : scheme === 'dark';
  return {
    dark,
    colors: dark ? darkTheme : lightTheme,
  };
}
