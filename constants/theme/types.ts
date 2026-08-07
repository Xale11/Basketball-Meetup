import { TextStyle, ViewStyle } from 'react-native';

/**
 * A background/border/foreground triplet. Used for badges, chips and tinted
 * panels so a caller never has to pick three colours that go together.
 */
export interface ToneTokens {
  bg: string;
  border: string;
  text: string;
  /** Saturated version, for icons and dots that sit on `bg`. */
  solid: string;
}

export interface ColorTokens {
  /** Screen background. */
  canvas: string;
  /** Primary card surface, sits on `canvas`. */
  surface: string;
  /** Inset panel inside a card (the darker info block on an activity card). */
  surfaceInset: string;
  /** Secondary/elevated surface — pressed states, unselected segment tracks. */
  surfaceAlt: string;

  border: string;
  borderStrong: string;

  /** Headings. */
  textPrimary: string;
  /** Body copy. */
  textBody: string;
  /** Secondary labels, metadata. */
  textMuted: string;
  /** Placeholders, disabled text. */
  textFaint: string;
  /** Text placed on top of `accent` / gradient fills. */
  textOnAccent: string;

  accent: string;
  accentHi: string;
  /** Accent used as a text/icon colour on dark surfaces. */
  accentText: string;

  /** Tinted tone sets. */
  accentTone: ToneTokens;
  successTone: ToneTokens;
  warningTone: ToneTokens;
  infoTone: ToneTokens;
  dangerTone: ToneTokens;
  neutralTone: ToneTokens;

  /** Modal scrim. */
  overlay: string;
  /** Map basemap tint, keeps pins legible against the palette. */
  mapBackdrop: string;
}

export interface RadiusTokens {
  sm: number;
  chip: number;
  card: number;
  hero: number;
  pill: number;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ShadowTokens {
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
  /** Coloured glow under primary CTAs and the nav FAB. */
  accentGlow: ViewStyle;
}

export interface GradientTokens {
  /** Primary CTA fill. */
  primary: readonly [string, string, ...string[]];
  /** Hero banner behind profile / societies headers. */
  hero: readonly [string, string, ...string[]];
  /** Scrim laid over card banner images so text stays legible. */
  imageScrim: readonly [string, string, ...string[]];
}

/**
 * Text styles set `fontFamily` and deliberately omit `fontWeight`. Android
 * synthesises a faux-bold when both are set, which double-bolds the loaded
 * Inter weights — the family name alone selects the right face.
 */
export interface TypographyTokens {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  cardTitle: TextStyle;
  body: TextStyle;
  bodyStrong: TextStyle;
  label: TextStyle;
  caption: TextStyle;
  /** Uppercase tracked micro-label ("ACTIVE FILTERS:", "NEXT ACTIVITY:"). */
  microLabel: TextStyle;
  badge: TextStyle;
  button: TextStyle;
}

export interface Theme {
  name: 'activCampus' | 'basketball';
  /** True when the palette is dark — drives StatusBar and keyboardAppearance. */
  dark: boolean;
  colors: ColorTokens;
  radius: RadiusTokens;
  spacing: SpacingTokens;
  shadow: ShadowTokens;
  gradient: GradientTokens;
  typography: TypographyTokens;
}

export const radius: RadiusTokens = {
  sm: 8,
  chip: 12,
  card: 16,
  hero: 24,
  pill: 999,
};

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  black: 'Inter-Black',
} as const;
