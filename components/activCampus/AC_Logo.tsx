import { View, Text, StyleSheet, Image } from 'react-native';
import { fontFamily } from '@/constants/theme';

/**
 * The supplied brand mark, replacing the SVG port of the web reference's
 * `Logo.tsx`. The artwork is authoritative now, so the hand-traced paths and
 * their gradient stops are gone rather than kept as a second source of truth.
 *
 * `logo-mark.png` is the textless variant — the wordmark below is rendered as
 * type so it stays crisp at every size and can follow `lightText`.
 */
const LOGO_MARK = require('@/assets/images/activCampus/logo-mark.png');

/**
 * teal-600. The mark is a fixed brand asset, not themed chrome — the SVG
 * gradient stops below are literals for the same reason, so the wordmark
 * matches them rather than drifting with the palette.
 */
const TEAL_600 = '#0D9488';
const TEAL_600_80 = 'rgba(13, 148, 136, 0.8)';

/**
 * icon px, title px, gap px.
 *
 * `icon` is the box the mark is fitted into, not its drawn height: the artwork
 * is wider than it is tall, so `contain` letterboxes it and the mark renders at
 * roughly 70% of this value. The numbers are sized up from the web reference's
 * sizeMap to compensate.
 */
const SIZES = {
  sm: { icon: 34, title: 16, tagline: 9, gap: 8 },
  md: { icon: 46, title: 20, tagline: 10, gap: 10 },
  lg: { icon: 62, title: 24, tagline: 11, gap: 12 },
  xl: { icon: 86, title: 30, tagline: 12, gap: 16 },
} as const;

interface AC_LogoProps {
  size?: keyof typeof SIZES;
  /** Render the wordmark beside the icon. */
  showText?: boolean;
  /** White title (on dark chrome) vs teal-950 (on light). */
  lightText?: boolean;
}

/**
 * The ActivCampus arrowhead mark, optionally with its wordmark.
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
    <Image
      source={LOGO_MARK}
      // The artwork is wider than it is tall, so `contain` keeps it from being
      // stretched into the square the old SVG viewBox occupied.
      resizeMode="contain"
      style={{ width: s.icon, height: s.icon }}
      accessibilityRole="image"
      accessibilityLabel="Active Campus"
    />
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
