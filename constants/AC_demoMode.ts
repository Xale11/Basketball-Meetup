/**
 * Court-booking demo mode (ActivCampus), from EXPO_PUBLIC_DEMO_MODE.
 *
 * Shows the organiser's demo controls (simulate players, expire the hold,
 * close registration), the booking calendar shortcut on Profile, and refreshes
 * session screens every few seconds so changes show up live.
 *
 * This only hides or shows UI. The server separately requires its own
 * AC_DEMO_MODE secret before it will run any demo action.
 */
export const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

/** Refresh interval for live court-booking screens in demo mode. */
export const DEMO_REFRESH_MS = 3000;
