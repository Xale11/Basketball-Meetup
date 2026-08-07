export type AppVariant = 'basketball' | 'activCampus';

/**
 * Note there is no `create` entry: creating an activity is no longer a tab. It
 * is a modal route (`app/create.tsx`) opened by the tab bar's floating (+),
 * which is shown for ActivCampus only.
 */
export type TabVisibility = {
  home: boolean;
  map: boolean;
  events: boolean;
  clubs: boolean;
  addCourt: boolean;
  profile: boolean;
};

const TAB_CONFIG: Record<AppVariant, TabVisibility> = {
  basketball: {
    home: true,
    map: true,
    events: true,
    clubs: true,
    addCourt: true,
    profile: true,
  },
  activCampus: {
    home: true,
    map: true,
    events: false,
    clubs: true,
    addCourt: false,
    profile: true,
  },
};

const variant = (process.env.EXPO_PUBLIC_APP_VARIANT ?? 'activCampus') as AppVariant;

export const appVariant: AppVariant = variant;
export const tabs: TabVisibility = TAB_CONFIG[variant];
