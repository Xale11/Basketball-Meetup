import { Theme, fontFamily, radius, spacing } from './types';

/**
 * ActivCampus — dark slate canvas with a teal/emerald accent.
 * Values are the resolved Tailwind palette used by the redesign reference in
 * `active-campus-ui-redesign/`.
 */
export const activCampusTheme: Theme = {
  name: 'activCampus',
  dark: true,

  colors: {
    canvas: '#020617', // slate-950
    surface: '#0F172A', // slate-900
    surfaceInset: '#020617', // slate-950 at 60% over a card reads as canvas
    surfaceAlt: '#1E293B', // slate-800

    border: '#1E293B', // slate-800
    borderStrong: '#334155', // slate-700

    textPrimary: '#FFFFFF',
    textBody: '#CBD5E1', // slate-300
    textMuted: '#94A3B8', // slate-400
    textFaint: '#64748B', // slate-500
    textOnAccent: '#020617', // slate-950 — dark text on bright teal

    accent: '#14B8A6', // teal-500
    accentHi: '#2DD4BF', // teal-400
    accentText: '#5EEAD4', // teal-300

    accentTone: {
      bg: '#042F2E', // teal-950
      border: '#0F766E', // teal-700
      text: '#5EEAD4', // teal-300
      solid: '#2DD4BF', // teal-400
    },
    successTone: {
      bg: '#022C22', // emerald-950
      border: '#047857', // emerald-700
      text: '#6EE7B7', // emerald-300
      solid: '#34D399', // emerald-400
    },
    warningTone: {
      bg: '#451A03', // amber-950
      border: '#B45309', // amber-700
      text: '#FCD34D', // amber-300
      solid: '#FBBF24', // amber-400
    },
    infoTone: {
      bg: '#1E1B4B', // indigo-950
      border: '#4338CA', // indigo-700
      text: '#A5B4FC', // indigo-300
      solid: '#818CF8', // indigo-400
    },
    dangerTone: {
      bg: '#4C0519', // rose-950
      border: '#BE123C', // rose-700
      text: '#FDA4AF', // rose-300
      solid: '#FB7185', // rose-400
    },
    neutralTone: {
      bg: '#1E293B', // slate-800
      border: '#334155', // slate-700
      text: '#CBD5E1', // slate-300
      solid: '#94A3B8', // slate-400
    },

    overlay: 'rgba(2, 6, 23, 0.85)',
    mapBackdrop: '#0F172A',
  },

  radius,
  spacing,

  // Drop shadows barely register on a near-black canvas, so separation comes
  // from borders. These stay subtle; `accentGlow` does the heavy lifting.
  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    accentGlow: {
      shadowColor: '#14B8A6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 10,
    },
  },

  gradient: {
    primary: ['#14B8A6', '#10B981'], // teal-500 → emerald-500
    hero: ['#0F172A', '#042F2E', '#0F172A'], // slate-900 → teal-950 → slate-900
    imageScrim: ['transparent', 'rgba(15, 23, 42, 0.55)', '#0F172A'],
  },

  typography: {
    h1: { fontFamily: fontFamily.extraBold, fontSize: 24, color: '#FFFFFF' },
    h2: { fontFamily: fontFamily.extraBold, fontSize: 20, color: '#FFFFFF' },
    h3: { fontFamily: fontFamily.bold, fontSize: 17, color: '#FFFFFF' },
    cardTitle: { fontFamily: fontFamily.extraBold, fontSize: 16, color: '#FFFFFF', lineHeight: 21 },
    body: { fontFamily: fontFamily.regular, fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
    bodyStrong: { fontFamily: fontFamily.semiBold, fontSize: 14, color: '#CBD5E1' },
    label: { fontFamily: fontFamily.bold, fontSize: 13, color: '#CBD5E1' },
    caption: { fontFamily: fontFamily.medium, fontSize: 12, color: '#94A3B8' },
    microLabel: {
      fontFamily: fontFamily.extraBold,
      fontSize: 11,
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    badge: {
      fontFamily: fontFamily.extraBold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    button: { fontFamily: fontFamily.extraBold, fontSize: 14 },
  },
};
