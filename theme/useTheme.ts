import { theme } from './colors';

export type Theme = typeof theme;

/**
 * The Modernist system is a single light scheme (no dark tokens are defined
 * for it) — `useTheme()` is kept as a hook so screens don't need to change if
 * a dark variant is added later.
 */
export function useTheme(): Theme {
  return theme;
}
