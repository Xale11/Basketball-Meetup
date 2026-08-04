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
    // TODO: run `eas init` with EXPO_PUBLIC_APP_VARIANT=activCampus and paste the id it prints.
    easProjectId: process.env.EAS_PROJECT_ID_ACTIVCAMPUS ?? null,
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
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
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
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
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
      eas: {
        projectId: variant.easProjectId,
      },
      googleMapsApiKey,
    },
  },
};
