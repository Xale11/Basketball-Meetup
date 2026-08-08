import { Theme, fontFamily, radius, spacing } from './types';

/**
 * Basketball Meetup — the existing light palette with the orange accent.
 * Values are lifted verbatim from the hardcoded literals that were previously
 * scattered through the screens, so BM renders unchanged after the migration.
 */
export const basketballTheme: Theme = {
  name: 'basketball',
  dark: false,

  colors: {
    canvas: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceInset: '#F8F9FA',
    surfaceAlt: '#F0F0F0',

    border: '#F0F0F0',
    borderStrong: '#E9ECEF',
    // BM keeps a neutral hairline — the teal tint is ActivCampus branding.
    chromeBorder: '#F0F0F0',

    textPrimary: '#1A1A1A',
    textBody: '#444444',
    textMuted: '#666666',
    textFaint: '#888888',
    textOnAccent: '#FFFFFF',

    accent: '#FF6B35',
    accentHi: '#FF8355',
    accentText: '#FF6B35',

    accentTone: {
      bg: '#FFF4EE',
      border: '#FFE0D1',
      text: '#FF6B35',
      solid: '#FF6B35',
    },
    successTone: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#16A34A',
      solid: '#28A745',
    },
    warningTone: {
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#EA6C00',
      solid: '#F59E0B',
    },
    infoTone: {
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: '#4A6CF7',
      solid: '#4A6CF7',
    },
    dangerTone: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#DC2626',
      solid: '#E53E3E',
    },
    neutralTone: {
      bg: '#F8F9FA',
      border: '#E9ECEF',
      text: '#666666',
      solid: '#9CA3AF',
    },

    overlay: 'rgba(0, 0, 0, 0.5)',
    mapBackdrop: '#FFFFFF',

    // Unchanged from the original hardcoded legend.
    mapPin: {
      personal: '#FF6B35', // orange
      society: '#7C3AED', // purple
      university: '#2563EB', // blue
    },
  },

  radius,
  spacing,

  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 6,
    },
    accentGlow: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  gradient: {
    primary: ['#FF6B35', '#FF8355'],
    hero: ['#FFFFFF', '#FFF4EE', '#FFFFFF'],
    imageScrim: ['transparent', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.65)'],
  },

  typography: {
    h1: { fontFamily: fontFamily.bold, fontSize: 24, color: '#1A1A1A' },
    h2: { fontFamily: fontFamily.bold, fontSize: 20, color: '#1A1A1A' },
    h3: { fontFamily: fontFamily.semiBold, fontSize: 17, color: '#1A1A1A' },
    cardTitle: { fontFamily: fontFamily.semiBold, fontSize: 16, color: '#1A1A1A', lineHeight: 21 },
    body: { fontFamily: fontFamily.regular, fontSize: 14, color: '#444444', lineHeight: 20 },
    bodyStrong: { fontFamily: fontFamily.semiBold, fontSize: 14, color: '#444444' },
    label: { fontFamily: fontFamily.medium, fontSize: 13, color: '#444444' },
    caption: { fontFamily: fontFamily.regular, fontSize: 12, color: '#888888' },
    microLabel: {
      fontFamily: fontFamily.bold,
      fontSize: 11,
      color: '#888888',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    badge: {
      fontFamily: fontFamily.semiBold,
      fontSize: 11,
      letterSpacing: 0.2,
    },
    button: { fontFamily: fontFamily.semiBold, fontSize: 16 },
  },
};
