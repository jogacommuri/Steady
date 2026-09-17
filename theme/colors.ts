/**
 * Steady design tokens — the Modernist system (Archivo, red accent, square
 * corners, hard 2px rules), ported for React Native.
 *
 * The system is a mono-accent scheme: there is one accent (red), used
 * sparingly for the primary action, small emphasis and the weight trend dot.
 * Meals / weight / workouts no longer carry separate hues — every "type"
 * label (meal type, workout type) reads in `accentText` (accent-700), and
 * everything else is ink-on-ground. Consume via `useTheme()`.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  border: string; // 2px structural rule
  borderLight: string; // 1px row rule

  text: string;
  textMuted: string;
  textFaint: string;
  textInverse: string;

  accent: string; // solid fills, icons, large display type
  accentText: string; // accent-700 — body-sized red text (links, CTAs, deltas)
  accentSoft: string; // accent-100 — tinted fill

  danger: string;
};

const neutral = {
  100: '#f8f4f4',
  200: '#eae7e7',
  300: '#d7d3d3',
  400: '#bab6b6',
  500: '#9b9797',
  600: '#7d7979',
  700: '#605d5d',
  800: '#444141',
  900: '#2d2b2b',
};

const accentRamp = {
  100: '#fff2ef',
  200: '#ffe0d9',
  300: '#ffc4b8',
  400: '#ff9783',
  500: '#ff563c',
  600: '#dd2b0f',
  700: '#ae1800',
  800: '#7c1405',
  900: '#4d170e',
};

const themeColors: ThemeColors = {
  background: '#f3f2f2',
  surface: '#eae9e9',
  border: 'rgba(32,30,29,0.4)',
  borderLight: neutral[300],

  text: '#201e1d',
  textMuted: neutral[700],
  textFaint: neutral[600],
  textInverse: '#ffffff',

  accent: '#ec3013',
  accentText: accentRamp[700],
  accentSoft: accentRamp[100],

  danger: accentRamp[700],
};

/** `theme.colors.*` — kept nested (rather than a flat export) to match `useTheme()`'s shape. */
export const theme = { colors: themeColors };

export const neutralRamp = neutral;
export const accentRampSteps = accentRamp;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Every radius in Modernist is 0 — never round a corner. */
export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
} as const;
