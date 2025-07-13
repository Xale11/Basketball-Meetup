import 'dotenv/config';

export default {
  expo: {
    name: "basketball-meetup-app",
    slug: "basketball-meetup-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.xale11.basketballmeetupapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "This app uses location to show nearby basketball courts and help you find courts near you.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses location to show nearby basketball courts and help you find courts near you."
      }
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location to show nearby basketball courts."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "8a11d484-17b7-4a98-8803-2f8b72c5166c"
      }
    },
    android: {
      package: "com.xale11.basketballmeetupapp",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY // Remove EXPO_PUBLIC_ prefix
        }
      }
    },
    "ios": {
      bundleIdentifier: "com.xale11.basketballmeetupapp",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  }
}; 