export type AppVariant = 'basketball' | 'activCampus';

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
  'activCampus': {
    home: true,
    map: true,
    events: true,
    clubs: false,
    addCourt: false,
    profile: true,
  },
};

const variant = (process.env.EXPO_PUBLIC_APP_VARIANT ?? 'basketball') as AppVariant;

export const tabs: TabVisibility = TAB_CONFIG[variant];
