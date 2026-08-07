import { appVariant } from '@/constants/appVariant';
import { activCampusTheme } from './activCampus';
import { basketballTheme } from './basketball';
import { Theme } from './types';

export * from './types';
export { activCampusTheme } from './activCampus';
export { basketballTheme } from './basketball';

/**
 * The active design tokens for this build.
 *
 * Resolved once at module load from `EXPO_PUBLIC_APP_VARIANT`, matching how
 * `app/(tabs)/index.tsx` and `app/(tabs)/clubs.tsx` already pick their screens.
 * There is no runtime theme switching yet — see AC-27 (light mode) in
 * ACTIVCAMPUS_UI_DELIVERY_PLAN.md for the work that would introduce it.
 */
export const theme: Theme = appVariant === 'activCampus' ? activCampusTheme : basketballTheme;

export const { colors, radius, spacing, shadow, gradient, typography } = theme;
