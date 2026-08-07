import { createContext, useContext, useMemo } from 'react';
import { Theme, ThemeMode, defaultMode, resolveTheme, theme as staticTheme } from '@/constants/theme';

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  /** No-op until AC-27 mounts a provider that owns the mode. */
  setMode: (mode: ThemeMode) => void;
};

/**
 * Defaults to the build's resolved tokens, so `useTheme()` works with no
 * provider mounted. AC-27 adds a provider above the app that owns `mode` and
 * persists it; every consumer of this hook then switches for free.
 */
export const ThemeContext = createContext<ThemeContextValue>({
  theme: staticTheme,
  mode: defaultMode,
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * Builds a StyleSheet from the active theme, rebuilding only when the theme
 * changes.
 *
 * Use this instead of a module-scope `const { colors } = theme` +
 * `StyleSheet.create({...})`. That pattern reads the tokens once at *import*
 * time and bakes them into the sheet, so a mode change can never reach it —
 * which is precisely what would make light mode a rewrite rather than a
 * setting.
 *
 *   const makeStyles = (t: Theme) =>
 *     StyleSheet.create({
 *       card: { backgroundColor: t.colors.surface, borderRadius: t.radius.card },
 *     });
 *
 *   function Card() {
 *     const s = useThemedStyles(makeStyles);
 *     return <View style={s.card} />;
 *   }
 *
 * Define `makeStyles` at module scope (not inline) so its identity is stable
 * and the memo actually holds.
 */
export function useThemedStyles<T>(makeStyles: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => makeStyles(theme), [makeStyles, theme]);
}

/** Convenience for the common case of only needing colours. */
export function useColors() {
  return useTheme().theme.colors;
}

export { resolveTheme, defaultMode };
export type { Theme, ThemeMode };
