export type AppVariant = 'basketball' | 'activCampus';

export type TabVisibility = {
  home: boolean;
  map: boolean;
  events: boolean;
  clubs: boolean;
  addCourt: boolean;
  create: boolean;
  profile: boolean;
};

const TAB_CONFIG: Record<AppVariant, TabVisibility> = {
  basketball: {
    home: true,
    map: true,
    events: true,
    clubs: true,
    addCourt: true,
    create: false,
    profile: true,
  },
  activCampus: {
    home: true,
    map: true,
    events: false,
    clubs: true,
    addCourt: false,
    create: true,
    profile: true,
  },
};

const variant = (process.env.EXPO_PUBLIC_APP_VARIANT ?? 'activCampus') as AppVariant;

export const appVariant: AppVariant = variant;
export const tabs: TabVisibility = TAB_CONFIG[variant];
