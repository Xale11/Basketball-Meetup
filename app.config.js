import 'dotenv/config';

/**
 * Two apps are built from this codebase, selected by EXPO_PUBLIC_APP_VARIANT.
 * Each needs its own identity: name, slug, bundle/package id, and EAS project.
 * See .claude/CLAUDE.md and constants/appVariant.ts.
 */
const VARIANTS = {
  basketball: {
    name: 'bball',
    slug: 'basketball-meetup-app',
    scheme: 'basketballmeetup',
    applicationId: 'com.xale11.basketballmeetupapp',
    easProjectId: '8a11d484-17b7-4a98-8803-2f8b72c5166c',
    // Still the stock Expo placeholder — Basketball Meetup has no artwork of
    // its own yet. Deliberately not sharing ActivCampus's: these ship as two
    // separate store listings under different bundle ids.
    icon: './assets/images/icon.png',
    adaptiveIcon: null,
    adaptiveIconBackground: '#FFFFFF',
    favicon: './assets/images/favicon.png',
    locationPermission:
      'This app uses location to show nearby basketball courts and help you find courts near you.',
    photosPermission:
      'This app needs access to your photos so you can upload and share basketball event or court images.',
  },
  activCampus: {
    name: 'A-Campus',
    slug: 'activ-campus',
    scheme: 'activcampus',
    applicationId: 'com.xale11.activcampus',
    easProjectId: '65428b97-c675-43a5-8d52-56fd9191e5d3',
    icon: './assets/images/activCampus/icon.png',
    adaptiveIcon: './assets/images/activCampus/adaptive-icon.png',
    // Deep teal, so the Android mask's surround reads as brand rather than
    // as a white gap around the mark.
    adaptiveIconBackground: '#0d3d3d',
    favicon: './assets/images/activCampus/favicon.png',
    locationPermission:
      'This app uses location to show events happening near you on campus.',
    photosPermission:
      'This app needs access to your photos so you can upload and share event images.',
  },
};

/**
 * Build environment, set per profile in eas.json. Only affects the display name,
 * so it stays a plain (non-EXPO_PUBLIC) var — read here at config time, never at runtime.
 * Production carries no suffix so the store listing shows the bare name.
 */
const NAME_SUFFIXES = {
  development: ' (Dev)',
  preview: ' (Preview)',
  production: '',
};

const variantName = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'activCampus';
const variant = VARIANTS[variantName];

if (!variant) {
  throw new Error(
    `Unknown EXPO_PUBLIC_APP_VARIANT "${variantName}". Expected one of: ${Object.keys(VARIANTS).join(', ')}`
  );
}

const appEnv = process.env.APP_ENV ?? 'development';
const nameSuffix = NAME_SUFFIXES[appEnv];

if (nameSuffix === undefined) {
  throw new Error(
    `Unknown APP_ENV "${appEnv}". Expected one of: ${Object.keys(NAME_SUFFIXES).join(', ')}`
  );
}

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default {
  expo: {
    name: `${variant.name}${nameSuffix}`,
    slug: variant.slug,
    scheme: variant.scheme,
    version: '1.0.0',
    orientation: 'portrait',
    icon: variant.icon,
    // The UI is hardcoded light (white surfaces, dark text). 'automatic' lets iOS
    // render native controls in dark appearance over them — white text on white.
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: variant.applicationId,
      supportsTablet: true,
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: variant.locationPermission,
        NSLocationAlwaysAndWhenInUseUsageDescription: variant.locationPermission,
      },
    },
    android: {
      package: variant.applicationId,
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      // Omitted when the variant has no adaptive foreground — an adaptiveIcon
      // block with a null foregroundImage fails the prebuild rather than
      // falling back to `icon`.
      ...(variant.adaptiveIcon
        ? {
            adaptiveIcon: {
              foregroundImage: variant.adaptiveIcon,
              backgroundColor: variant.adaptiveIconBackground,
            },
          }
        : {}),
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: variant.favicon,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      '@react-native-community/datetimepicker',
      'expo-sqlite',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: variant.locationPermission,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: variant.photosPermission,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      // Omitted entirely when unset — EAS rejects a null projectId and will
      // link/create the project on the next CLI run when the key is absent.
      ...(variant.easProjectId
        ? { eas: { projectId: variant.easProjectId } }
        : {}),
      googleMapsApiKey,
    },
  },
};
