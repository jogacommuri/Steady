/**
 * Steady design tokens — the sage / clay / plum / gold palette from the
 * original artifact, ported for React Native with light + dark variants.
 *
 * Consume via `useTheme()` (theme/useTheme.ts) so screens react to the
 * device colour scheme automatically.
 */

export type ThemeColors = {
  // surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;

  // text
  text: string;
  textMuted: string;
  textInverse: string;

  // brand accents
  sage: string; // meals
  clay: string; // weight
  plum: string; // workouts
  gold: string; // highlights / deltas

  // feedback
  danger: string;
};

const palette = {
  sage: '#7C9A82',
  sageDark: '#9BB8A1',
  clay: '#C08457',
  clayDark: '#D69B6E',
  plum: '#7A5C7E',
  plumDark: '#A484A8',
  gold: '#D9A441',
  goldDark: '#E8BE6A',
  danger: '#C0524A',
  dangerDark: '#E08078',
};

export const lightTheme: ThemeColors = {
  background: '#F6F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEAE1',
  border: '#E0D9CC',

  text: '#2B2A28',
  textMuted: '#6E6A63',
  textInverse: '#FFFFFF',

  sage: palette.sage,
  clay: palette.clay,
  plum: palette.plum,
  gold: palette.gold,

  danger: palette.danger,
};

export const darkTheme: ThemeColors = {
  background: '#1B1A18',
  surface: '#26241F',
  surfaceAlt: '#302D27',
  border: '#3B382F',

  text: '#EFEAE1',
  textMuted: '#A8A198',
  textInverse: '#1B1A18',

  sage: palette.sageDark,
  clay: palette.clayDark,
  plum: palette.plumDark,
  gold: palette.goldDark,

  danger: palette.dangerDark,
};

/** Per-tracker accent colour, keyed by domain. */
export const accentFor = (
  kind: 'meals' | 'weight' | 'workouts',
  c: ThemeColors
): string => {
  switch (kind) {
    case 'meals':
      return c.sage;
    case 'weight':
      return c.clay;
    case 'workouts':
      return c.plum;
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;
