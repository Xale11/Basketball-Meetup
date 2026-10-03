import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme, Theme } from '@/hooks/useTheme';

type Props = Omit<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor' | 'titleColor'
>;

/**
 * How far down the spinner settles, measured from the top of the scrollable.
 *
 * Android draws the spinner *above* the scrollable's top edge and animates it
 * down, so at the default offset of 0 it can stay clipped out of view for the
 * whole gesture — especially where the scrollable starts partway down the
 * screen. A positive offset puts it on screen from the start of the pull.
 */
const PROGRESS_OFFSET = 24;

/**
 * The spinner colour — the highest-contrast foreground the theme has.
 *
 * `textPrimary` resolves to white on ActivCampus's dark canvas and to near-black
 * (#1A1A1A) on Basketball Meetup's white one. Hardcoding white would have made
 * it invisible in the light theme, which is the same failure in reverse.
 *
 * Tinted brand colours were tried first (teal accent, then the emerald green)
 * and both read as too faint in practice, despite measuring 8:1 and 10.5:1
 * against the canvas — a thin spinner arc needs more separation than a contrast
 * ratio suggests.
 */
const spinnerColor = (theme: Theme) => theme.colors.textPrimary;

/**
 * Pull-to-refresh spinner that is actually visible on both platforms.
 *
 * `tintColor` is iOS-only. Android reads `colors` (an array) and paints the
 * spinner on a `progressBackgroundColor` disc — leave those unset and it draws
 * its default dark spinner on a light disc, which is invisible against the
 * ActivCampus canvas. Every call site was passing `tintColor` alone, so on
 * Android there was effectively no spinner at all.
 *
 * Wrapped rather than fixed in twelve places so the two platforms cannot drift
 * apart again.
 */
export function ThemedRefreshControl(props: Props) {
  const { theme } = useTheme();
  const color = spinnerColor(theme);

  return (
    <RefreshControl
      {...props}
      // iOS
      tintColor={color}
      // Android — the spinner arc, and the disc it sits on. The disc is the
      // raised surface rather than the canvas, so the arc has something to sit
      // against whichever background the screen happens to use.
      colors={[color]}
      progressBackgroundColor={theme.colors.surface}
      progressViewOffset={props.progressViewOffset ?? PROGRESS_OFFSET}
    />
  );
}
