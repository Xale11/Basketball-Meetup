import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { fontFamily } from '@/constants/theme';

/**
 * teal-600. The mark is a fixed brand asset, not themed chrome — the SVG
 * gradient stops below are literals for the same reason, so the wordmark
 * matches them rather than drifting with the palette.
 */
const TEAL_600 = '#0D9488';
const TEAL_600_80 = 'rgba(13, 148, 136, 0.8)';

/** Mirrors the reference's sizeMap: icon px, title px, gap px. */
const SIZES = {
  sm: { icon: 28, title: 16, tagline: 9, gap: 8 },
  md: { icon: 38, title: 20, tagline: 10, gap: 10 },
  lg: { icon: 52, title: 24, tagline: 11, gap: 12 },
  xl: { icon: 72, title: 30, tagline: 12, gap: 16 },
} as const;

interface AC_LogoProps {
  size?: keyof typeof SIZES;
  /** Render the wordmark beside the icon. */
  showText?: boolean;
  /** White title (on dark chrome) vs teal-950 (on light). */
  lightText?: boolean;
}

/**
 * The ActivCampus arrowhead mark and wordmark, ported from the web reference's
 * `Logo.tsx` to react-native-svg. Paths and gradient stops are unchanged so it
 * stays pixel-identical; only the SVG dialect differs.
 *
 * The wordmark is a two-line lockup — "ACTIVE CAMPUS" over a
 * "STUDENT ACTIVITY NETWORK" tagline — not a single word.
 */
export function AC_Logo({
  size = 'md',
  showText = true,
  lightText = true,
}: AC_LogoProps) {
  const s = SIZES[size];

  const icon = (
    <Svg width={s.icon} height={s.icon} viewBox="0 0 200 200" fill="none">
      <Defs>
        <LinearGradient
          id="acGrad"
          x1="20"
          y1="20"
          x2="180"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#0d9488" />
          <Stop offset="50%" stopColor="#0f766e" />
          <Stop offset="100%" stopColor="#042f2e" />
        </LinearGradient>
        <LinearGradient
          id="acAccent"
          x1="100"
          y1="20"
          x2="180"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#2dd4bf" />
          <Stop offset="100%" stopColor="#0d9488" />
        </LinearGradient>
      </Defs>

      {/* Outer triangle, left wing */}
      <Path
        d="M 100,20 L 25,145 C 20,154 26,165 36,165 L 90,165 L 90,95 L 60,135 L 45,122 L 90,62 L 90,20 Z"
        fill="url(#acGrad)"
      />
      {/* Centre vertical needle */}
      <Path d="M 100,18 L 108,125 L 100,165 L 92,125 Z" fill="#14b8a6" />
      {/* Right wing */}
      <Path
        d="M 100,20 L 100,62 L 145,122 L 130,135 L 100,95 L 100,165 L 164,165 C 174,165 180,154 175,145 Z"
        fill="url(#acAccent)"
      />
      {/* Bottom notch */}
      <Path d="M 100,138 L 118,172 L 100,162 L 82,172 Z" fill="#f0fdfa" />
    </Svg>
  );

  if (!showText) return <View style={styles.row}>{icon}</View>;

  return (
    <View style={[styles.row, { gap: s.gap }]}>
      {icon}
      <View style={styles.lockup}>
        <Text
          style={[
            styles.title,
            {
              fontSize: s.title,
              // leading-none
              lineHeight: s.title,
              color: lightText ? '#FFFFFF' : '#042F2E',
            },
          ]}
          numberOfLines={1}
        >
          ACTIVE <Text style={styles.titleAccent}>CAMPUS</Text>
        </Text>
        <Text style={[styles.tagline, { fontSize: s.tagline }]} numberOfLines={1}>
          Student Activity Network
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockup: {
    flexDirection: 'column',
  },
  title: {
    fontFamily: fontFamily.extraBold,
    // tracking-wider
    letterSpacing: 0.6,
  },
  titleAccent: {
    fontFamily: fontFamily.bold,
    color: TEAL_600,
  },
  tagline: {
    fontFamily: fontFamily.medium,
    color: TEAL_600_80,
    // tracking-widest
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
