import { AppVariant, appVariant } from '@/constants/appVariant';
import { activCampusTheme } from './activCampus';
import { basketballTheme } from './basketball';
import { Theme } from './types';

export * from './types';
export { activCampusTheme } from './activCampus';
export { basketballTheme } from './basketball';

export type ThemeMode = 'light' | 'dark';

/**
 * Token sets keyed by (variant, mode).
 *
 * Only one mode exists per variant today — ActivCampus is dark, Basketball
 * Meetup is light. Light mode (AC-27) is additive from here: author
 * `activCampus.light.ts`, add it to this table, and every consumer that reads
 * through `useTheme()` picks it up. Nothing else has to change.
 */
const THEMES: Record<AppVariant, Partial<Record<ThemeMode, Theme>>> = {
  activCampus: { dark: activCampusTheme },
  basketball: { light: basketballTheme },
};

/** The mode a variant starts in, and its fallback when a mode has no tokens. */
export const defaultMode: ThemeMode = appVariant === 'activCampus' ? 'dark' : 'light';

/**
 * Resolves tokens for a variant/mode pair, falling back to the variant's
 * default mode while the second palette does not exist yet.
 */
export function resolveTheme(
  variant: AppVariant = appVariant,
  mode: ThemeMode = defaultMode,
): Theme {
  const forVariant = THEMES[variant];
  return forVariant[mode] ?? forVariant[defaultMode] ?? activCampusTheme;
}

/**
 * The active design tokens for this build.
 *
 * NOTE: this is a module-load snapshot and therefore CANNOT react to a mode
 * change. Prefer `useTheme()` / `useThemedStyles()` from `@/hooks/useTheme` in
 * anything new — see the "Theming" note in ACTIVCAMPUS_UI_DELIVERY_PLAN.md.
 * This export stays for the components not yet migrated off it.
 */
export const theme: Theme = resolveTheme();

export const { colors, radius, spacing, shadow, gradient, typography } = theme;
