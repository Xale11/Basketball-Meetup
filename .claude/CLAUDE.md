# Project: ActivCampus & Basketball Meetup 2 in 1 app repo

The project is concurrently developing two apps that will eventually branch off into two repos. One app is a University social event app called Activ Campus, the is a basketball meetup app.

## Commands

```bash
yarn start         # Expo dev server (Expo Go)
yarn dev           # Expo dev server (dev client / custom native build)
yarn android       # Run on Android device/emulator
yarn ios           # Run on iOS simulator
yarn build:web     # Export web bundle
yarn lint          # ESLint across all .js/.jsx/.ts/.tsx files
```

No test runner is configured.

## Two Apps, One Codebase

This repo builds two apps from the same codebase:

| App | Audience | `EXPO_PUBLIC_APP_VARIANT` |
|-----|----------|--------------------------|
| **ActivCampus** | University students only — event-focused, no court map | `activCampus` |
| **Basketball Meetup** | Open to everyone — basketball-focused, includes court map | `basketball` |

The active app is controlled by `constants/appVariant.ts`, which reads `EXPO_PUBLIC_APP_VARIANT` (defaults to `activCampus`). It exports:
- `appVariant: AppVariant` — the current variant (`'basketball' | 'activCampus'`)
- `tabs: TabVisibility` — which tabs are visible for the variant

**Naming convention:** Components, screens, and API logic that are specific to one app must be prefixed:
- `AC_` for ActivCampus-only (e.g. `AC_UniversityEventCard`)
- `BM_` for Basketball Meetup-only (e.g. `BM_CourtCard`)
- No prefix for shared code

**If it's not clear which app a change targets, ask before implementing.**

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps (Android + iOS)
- `EXPO_PUBLIC_APP_VARIANT` — `activCampus` or `basketball`

All vars are prefixed `EXPO_PUBLIC_*` and are inlined at build time by Metro.

## Architecture

### Navigation
Expo Router with typed routes (`experiments.typedRoutes: true`). File-based routing under `app/`:
- `app/(tabs)/` — main tab bar (home, events, map, create, clubs, profile)
- `app/auth/` — login/signup screens
- `app/event/` — event detail routes
- `app/onboarding/` — onboarding flow

Root layout (`app/_layout.tsx`) wraps everything in `QueryClientProvider > AuthProvider > Stack`.

### Data Layer
- I utlise only supabase for my backend database and auth. Any references to firebase should be ignored or refactored to point at supabase
- **Supabase** — users, events, societies, universities, check-ins, payments (`api/*.api.ts`)
- The alot of the types in ./types model tables and relationships in the supabase database

All API functions are plain async functions in `api/`. They throw `new Error(JSON.stringify(error))` on failure.

### React Query Hooks
Every API function has a corresponding hook in `hooks/<domain>/`. The pattern normalizes the React Query API:
- Queries expose `loading`, `error`, and a named data field (e.g. `events`, `user`) instead of `isPending`/`data`
- Mutations expose a named mutate alias (e.g. `createEvent`) and invalidate related query keys on success
- `staleTime: 1000 * 60 * 5` and `refetchOnWindowFocus: false` are used by default

### Auth
`providers/AuthProvider.tsx` exposes `useAuth()` → `{ user, session, loading }`. Auth state is persisted via AsyncStorage on mobile. Mutations check `isAuth()` and redirect to `/auth/login` if the session is gone.

### Types
All shared types live in `types/`. Key files: `user.ts`, `event.ts`, `club.ts`, `courts.ts`, `societies.ts`, `universities.ts`, `checkin.ts`, `payment.ts`.

### Path Aliases
`@/*` maps to the project root. Use `@/api/...`, `@/types/...`, `@/components/...` etc. everywhere.

## Code Style
- Prettier: 2-space indent, single quotes, bracket spacing (see `.prettierrc`)
- TypeScript strict mode is on
