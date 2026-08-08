# ActivCampus UI Redesign — Feasibility & Migration Plan

**Source of truth:** `active-campus-ui-redesign/src/` (20 files, ~6.4k LOC)
**Target:** the Expo/React Native app in this repo (`app/`, `components/`, ~10.4k LOC)
**Scope:** ActivCampus only. Where a component is shared with Basketball Meetup, ActivCampus wins and BM is kept working via a variant switch.

---

## 1. Verdict

**Feasible — but it is a rewrite of the presentation layer, not a port.**

The redesign is a **React web app**: Vite + Tailwind CSS v4 + `lucide-react` + `localStorage` mock data. The real app is **React Native + Expo Router + Supabase + React Query**. There is **no file in `active-campus-ui-redesign/src/` that can be copied across**. Every `className` string has to become a `StyleSheet` object, every `<div>` a `<View>`, every `<input>`/`<select>` an RN equivalent.

What *is* highly portable is the thing that actually matters: **the visual language and the information architecture**. Dark slate canvas, teal/emerald accent, rounded-2xl/3xl cards, pill filter rows, uppercase micro-labels, badge taxonomy, sectioned feed, floating centre FAB — all of that maps cleanly onto RN primitives the project already has installed (`expo-linear-gradient`, `expo-blur`, `lucide-react-native`, `react-native-safe-area-context`).

Rough split of the work:

| Bucket | Verdict | Notes |
|---|---|---|
| Colour, spacing, radius, typography, badges, cards, pills | **Straightforward** | Mechanical translation, high fidelity achievable |
| Screen structure / IA | **Straightforward** | Tab set already matches 1:1 |
| Bottom nav with overlapping centre FAB | **Moderate** | Needs a custom `tabBar`, not the default `Tabs` |
| Global sticky header (logo/bell/avatar) | **Moderate** | New shared component, blur via `expo-blur` |
| Society detail (5 tabs incl. Executive tools) | **Moderate** | Large screen, absorbs `club/[id]/manage.tsx` |
| Light/dark theme toggle | **Moderate — recommend deferring** | The redesign's light mode is a 300-line CSS override sheet; doubles styling work |
| Notifications drawer | **Blocked on backend** | No `notifications` table exists |
| Society announcements | **Blocked on backend** | No `announcements` table exists |
| Activity category + tag pills | **Blocked on backend** | `events` has no `category` or `tags` column |
| Interests tab, degree/year, verified-student badge | **Blocked on backend** | No columns on `profiles` |
| SVG campus map with %-coordinate landmarks | **Cannot match exactly** | App uses real lat/lng + `react-native-maps`; see §6 |

**Recommended sequencing:** ship the design system + the four tab screens first (that's ~80% of the perceived change), then detail screens, then the backend-gated features.

---

## 2. Why nothing copies across

Concrete blockers found in the redesign source, and their RN answers:

| Web construct (used heavily) | RN answer |
|---|---|
| `className="bg-slate-900 ..."` (Tailwind) | `StyleSheet.create` + a shared token file |
| `bg-gradient-to-r from-teal-500 to-emerald-500` | `<LinearGradient>` (`expo-linear-gradient`, already a dep) |
| `backdrop-blur-md` on header/nav | `<BlurView>` (`expo-blur`, already a dep) |
| `shadow-xl shadow-teal-950/50`, `ring-2 ring-teal-500/60` | `shadowColor/Offset/Opacity/Radius` + `elevation`; ring → `borderWidth` |
| `hover:`, `group-hover:`, `active:scale-95` | No hover on mobile. Use `Pressable` + `pressed` style / `activeOpacity` |
| `<input>`, `<textarea>`, `<select>` | `<TextInput>`; `<select>` → the existing `PillSelector` / a bottom sheet |
| `overflow-x-auto` category strips | `<ScrollView horizontal>` |
| `sticky top-0` day headers in "This Week" | `<SectionList>` with `stickySectionHeadersEnabled` |
| `line-clamp-2` | `numberOfLines={2}` |
| `space-y-*`, `gap-*` | `gap` works in RN 0.81 ✅ (this one is free) |
| `grid md:grid-cols-2` | Drop to single column — the app is mobile-only |
| `animate-pulse` (live dot, unread badge) | `react-native-reanimated` (already a dep) |
| `<form onSubmit>`, `e.stopPropagation()` | `onPress` handlers; nest `Pressable` carefully |
| `localStorage` + `INITIAL_*` mock data | React Query hooks against Supabase (already exist) |

Also note the redesign's `HomeFeed` contains a **"Device Frame Mode" toggle** (`Full Layout` / `iOS-Android Frame`) — that is prototype scaffolding for viewing the web mock at phone width. **Do not port it.**

---

## 3. Design tokens to extract

The redesign is dark-first with a teal/emerald accent. The current app is **light with basketball orange `#FF6B35`** — the two are opposites, which is the single biggest visual change.

Create `constants/theme/activCampus.ts` with these (resolved Tailwind values):

```
Canvas        slate-950  #020617      Card          slate-900  #0F172A
Inset panel   slate-800  #1E293B      Border        slate-800  #1E293B
Border strong slate-700  #334155      Muted text    slate-400  #94A3B8
Body text     slate-300  #CBD5E1      Heading       white      #FFFFFF

Accent        teal-500   #14B8A6      Accent hi     teal-400   #2DD4BF
Accent text   teal-300   #5EEAD4      Accent tint   teal-950   #042F2E
Success       emerald-500 #10B981     Success text  emerald-300 #6EE7B7
Warn/Exec     amber-400  #FBBF24      Warn tint     amber-950  #451A03
University    indigo-400 #818CF8      Uni tint      indigo-950 #1E1B4B
Danger        rose-500   #F43F5E      Danger tint   rose-950   #4C0519

Radius   pill 999 · card 16 (rounded-2xl) · hero 24 (rounded-3xl) · chip 12
Gradient primary: linear 90° #14B8A6 → #10B981, label colour #020617
```

### 3.1 Keep Basketball Meetup on orange

`constants/theme.ts` today is a flat `Colors` enum of basketball browns/orange that is **not** actually consumed by the screens (they hardcode `#FF6B35`, `#F8F9FA`, `#1A1A1A` inline). Restructure to:

```ts
// constants/theme.ts
export const theme = appVariant === 'activCampus' ? activCampusTheme : basketballTheme;
```

This is what lets shared screens (`map.tsx`, `EventCard`, `events.tsx`, all of `components/ui/*`) adopt the redesign for ActivCampus **without** turning Basketball Meetup dark teal. Do this **first** — every other task depends on it.

### 3.2 Fonts are currently broken

`app/_layout.tsx` loads `Inter_400/500/600/700` — but **`fontFamily` appears zero times in the entire codebase**. Inter is loaded and never applied; everything renders in the platform system font. Two actions:

1. Add `Inter_800ExtraBold` and `Inter_900Black` to `useFonts` — the redesign uses `font-extrabold` (800) and `font-black` (900) on almost every heading, badge and button label.
2. Set `fontFamily` explicitly in the token file (`Inter-Bold` etc.) rather than relying on `fontWeight`, which does not reliably select loaded weights on Android.

---

## 4. Screen-by-screen mapping

### 4.1 Navigation shell

**Redesign:** sticky global `Header` (logo + "…ac.uk Verified" pill + bell w/ unread count + avatar) on every screen, plus a fixed bottom `Navbar` with **5 slots: Discover · Map · (+) · Societies · Profile**, where the (+) is a 56px gradient circle floating **above** the bar (`-top-6`) with a 4px canvas-coloured ring.

**Current:** `app/(tabs)/_layout.tsx` — default `Tabs` bar, white, orange tint, 80px tall. Order is `index, map, create, events, clubs, add-court, profile` with `href: null` hiding the BM-only ones. For ActivCampus the visible set is already **home, map, create, clubs, profile** — **the tab set matches the redesign exactly. No tabs need to be added or removed.**

**Work:**
- Replace the default bar with a custom `tabBar` render prop (the floating FAB cannot be done with `tabBarIcon` alone — it must overflow the bar's bounds).
- Relabel for ActivCampus: `Home → Discover`, `Clubs → Societies` (the `clubs` screen already switches its title on variant).
- New `components/AC_AppHeader.tsx` rendered by each of the four tab screens (RN has no shared sticky header across a tab navigator without nesting a Stack — a per-screen component is simpler and matches what the screens already do).
- Keep the existing `ProfileTabIcon` unread-badge logic; it already sums friend requests + event invites.

### 4.2 Discover / Home — `components/home/ActivCampusHome.tsx`

| Redesign (`HomeFeed.tsx`) | Today | Gap |
|---|---|---|
| 3-up segmented time tabs: **Today / Tomorrow / This Week** with icons | Horizontal chips: **Now / Today / This Week** | Different set + different control. Redesign has no "Now" tab — "Happening Now" is a *section* inside Today |
| Search input with clear button | Search icon in header, **non-functional** | Build it |
| Horizontal category pill strip (9 categories) | — | **Blocked:** `events` has no `category` |
| Organiser filter: All / University / Exec / Associate | — | Approximate from `host_type` (see §5) |
| Cost filter: All / Free / Paid + max-price slider | All / Free / Paid chips | Slider is extra; `price_from` exists |
| Removable active-filter chip row + "Reset All" | — | Build it (pure UI) |
| Today split into **Happening Now** → **Starting Soon (next 2h)** → **Later Today** | Happening Now + one flat list | Add the 2h bucket — trivial, data already present |
| This Week grouped by day with sticky date headers | Flat list | Use `SectionList` |

The existing filtering logic (`isHappeningNow`, `matchesTimeFilter`, `matchesCostFilter`) is sound and mostly survives; the sectioning and the chrome are what change.

### 4.3 Activity card — `components/events/EventCard.tsx`

The most-reused component in the app, and the one that carries the most of the redesign's identity.

Redesign card = image banner (h-36, gradient scrim) → classification badge top-left → cost badge top-right → title → organiser row w/ icon → **inset dark info block** (clock + date/time range, pin + location) → category + tag pills → **friends-attending avatar row** → footer (places remaining · `View details` · `Join`).

Current card = title + host badge + time + address + join button. It is functionally correct (join/leave/request states, invite-only handling) — **keep all of that logic**, restyle the shell.

Gaps: banner image (`events.banner_image_url` exists but is unused by the card), category/tag pills (**blocked**), places-remaining (`max_participants` exists but attendee count is not fetched), friend avatars (`friendsAttendingCount` prop exists but `ActivCampusHome` never passes it, and the redesign wants avatars not a count).

> **Cleanup:** `components/EventCard.tsx` (299 lines, root) and `components/ClubCard.tsx` (257 lines) are **dead** — nothing imports them. Delete rather than restyle.

### 4.4 Societies — `components/societies/SocietiesScreen.tsx` (801 lines)

| Redesign (`SocietiesView.tsx`) | Today |
|---|---|
| Gradient hero banner + "Create Society" CTA | Plain header |
| 2 sub-tabs: **My Societies (n) / Discover (n)** | **4** tabs: Events / Discover / My Societies / Managed |
| Search + category pill row | Search + multi-select category chips ✅ |
| Banner-led card: banner image, role badge (President/Committee/Member), logo, name + verified tick, member count, description, **"Next Activity" inset box** | Initial-letter avatar, name, category, description, member count |
| Footer: `View activities` · `Leave`/`+ Join` · `View society →` | Tap-through only |

**Decision needed:** the redesign drops the *Events* and *Managed* tabs. Events are already on Discover; "Managed" is superseded by the role badge on each card + the Executive tab inside society detail. Recommend following the redesign (2 tabs) and folding "Managed" into the society detail screen.

**Blocked:** society `banner`, `verified_official` — no columns. Cards will look sparse without a banner; consider a generated gradient placeholder keyed on society id as an interim.

### 4.5 Profile — `app/(tabs)/profile.tsx`

Biggest structural change. Redesign turns Profile into a **4-tab hub**:

1. **My Activity Hub** — sub-tabs `Upcoming (n) / Created by Me (n) / Past (n)`
2. **Friends** — add-by-email + connections grid
3. **My Interests & Preferences** — 8 toggleable category cards
4. **Settings** — bio editor (150 char), **theme picker**, email-verified row, push toggle, change-password form

Today: a single scroll of `SectionCard`s (My Activity, My Network, Event Invites, Society Memberships) plus a dead menu list (`Payment Methods`, `Notifications`, `Privacy & Security`, `Settings` are all `onPress: () => {}`).

Mapping:
- `ActivitySection` already fetches `myEvents` + `participantEvents` → feeds tab 1 directly; only needs an Upcoming/Past split by date.
- `My Network` + `Event Invites` cards → tab 2. **Keep the app's real friend-request flow** (`friends/requests`, `friends/search`) — the redesign's "add friend by email, instantly connected" is mock behaviour and is a downgrade.
- Tab 3 is **blocked** — `profiles` has no `interests` column.
- Tab 4 replaces the dead menu. Bio editing already exists in `EditProfileModal`; password change needs `supabase.auth.updateUser`.
- Redesign header shows `email • degree (yearOfStudy)` and a "Verified Student" pill. `profiles` has `course` but no `degree`/`year_of_study`, and no verification flag.

### 4.6 Create — `app/(tabs)/create.tsx` (521 lines)

**Relocation.** In the redesign, Create is a **modal** launched by the nav FAB, never a tab destination. Today it is a full tab screen at `app/(tabs)/create.tsx`.

Recommendation: move to `app/create.tsx` with `presentation: 'modal'`, keep the FAB in the custom tab bar, and have it `router.push('/create')`. This preserves the redesign's feel (overlay, X to dismiss) and removes an empty-titled tab route.

The redesign's form adds: duration-in-minutes selector, campus-landmark picker, classification picker, tag input with chips, cost-split toggle, and **invite-friends-inline**. The app's form covers name/description/dates/location/visibility/join-policy/booking. Tags and classification are blocked; the rest is restyling. Note `components/events/EventFormModal.tsx` (653 lines) already exists but is only used by the BM `events` tab — do not entangle the two.

### 4.7 Society detail — `app/society/[id].tsx` (506 lines)

Redesign `SocietyDetailModal` (1015 lines — the largest file) has **5 tabs**: Activities (with all/exec/associate filter) · Overview · Announcements · Members · **Executive**.

The Executive tab is a management console: post announcement, promote member to Committee, edit description, view grant budget + compliance status.

**Relocation:** `app/club/[id]/manage.tsx` should be **absorbed into this screen as the Executive tab**, gated on the viewer's `society_memberships.role_id` being in `ADMIN_SOCIETY_ROLES` (that constant already exists in `types/societies.ts`).

**Blocked:** Announcements tab (no table), `grantBudget` / `complianceStatus` (no columns).

### 4.8 Activity detail — `app/event/[id].tsx` (437 lines)

Maps to `ActivityDetailModal` (261 lines) — the app's version is already richer. Restyle only. Keep as a pushed route rather than converting to a modal; expo-router handles the back gesture better and deep links matter.

### 4.9 Notifications — **new screen**

Redesign has a right-side `NotificationDrawer` opened by the header bell, with an unread count badge and "Mark all read". **There is no notifications screen and no `notifications` table.** See §5.

---

## 5. Backend gaps

Confirmed against the live Supabase schema (15 public tables). None of the following exist:

| Redesign feature | Missing | Suggested resolution |
|---|---|---|
| Notification drawer + unread bell badge | `notifications` table | New table `(id, user_id, type, title, message, read, event_id, created_at)`. Interim: point the bell at the existing friend-request + event-invite counts, which the tab badge already aggregates |
| Society announcements tab | `society_announcements` table | New table `(id, society_id, author_id, title, content, is_important, created_at)` |
| Category pill on cards + category filter strip | `events.category` | Add a `text` column + enum in `types/event.ts`. Until then: hide the strip |
| Free-text tag chips | `events.tags` | `text[]` column |
| University / Exec / Associate classification | — | **Derivable:** `host_type=UNIVERSITY → University`, `SOCIETY → Exec`, `USER → Associate`. Imperfect (a member-led society activity reads as "Exec") but ships today with no migration |
| "n places remaining" / "Fully Booked" | attendee count per event | Add a count aggregate to `useFetchEvents` (`event_participants(count)`); `max_participants` already exists |
| Friends-attending avatar row on cards | friend×participant join | `components/friends/FriendsAttending.tsx` exists — needs wiring into the card and into the feed query |
| Society banner image, verified tick, member count | `societies.banner_url`, `.verified_official` | Member count is computable from `society_memberships`; banner/verified need columns |
| Interests tab | `profiles.interests` | `text[]` column |
| "Verified Student" pill, degree, year of study | `profiles` columns | Verification derivable from `university_id` + email domain; degree/year need columns (`course` exists) |
| Grant budget / compliance status (Executive tab) | `societies` columns | Low priority — arguably out of scope |
| Light/dark theme preference | client-side | AsyncStorage is fine; no table needed |

### 5.1 `society_memberships` has non-standard foreign keys

Every other table names its constraints `<table>_<column>_fkey`, which is the hint
PostgREST embeds rely on throughout `api/`. `society_memberships` does not:

| Constraint | Target | Note |
|---|---|---|
| `societyMemberships_userId_fkey` | `auth.users(id)` | camelCase; **redundant** |
| `societyMemberships_userId_fkey1` | `public.profiles(id)` | the one embeds need; `1` suffix because it was added second |
| `societyMemberships_societyId_fkey` | `public.societies(id)` | camelCase |
| `societyMemberships_roleId_fkey` | `public.society_roles(id)` | camelCase |

This is a live footgun: any embed written to the convention (`profiles!society_memberships_user_id_fkey`)
fails at runtime with `PGRST200`, not at compile time. It already bit
`getSocietyMembers` once.

The `auth.users` FK is redundant — `profiles.id` is itself
`REFERENCES auth.users(id) ON DELETE CASCADE`, so membership rows are already
transitively guaranteed to point at a real auth user, and the cascade behaviour
is identical.

**Suggested cleanup migration** (not applied — it is a schema change, and the
runtime fix did not require it):

```sql
alter table public.society_memberships
  drop constraint "societyMemberships_userId_fkey";          -- redundant auth.users FK

alter table public.society_memberships
  rename constraint "societyMemberships_userId_fkey1"  to society_memberships_user_id_fkey;
alter table public.society_memberships
  rename constraint "societyMemberships_societyId_fkey" to society_memberships_society_id_fkey;
alter table public.society_memberships
  rename constraint "societyMemberships_roleId_fkey"    to society_memberships_role_id_fkey;
```

Renaming constraints changes the PostgREST hints, so `api/societies.api.ts` must
be updated in the same change.

---

## 6. The one thing that cannot match exactly

`CampusMap.tsx` renders a **hand-drawn SVG campus** (`viewBox="0 0 1000 700"`) and places activity pins at hardcoded percentage coordinates from `LocationLandmark.coords: {x, y}`, with a "radius in miles" filter layered on top.

The app uses `react-native-maps` with real `latitude`/`longitude` from Supabase, via `components/BM_InteractiveMap.tsx`.

A fixed SVG campus cannot represent real coordinates, cannot pan/zoom to a user's actual position, and would need a bespoke traced illustration per university. **Recommendation:** keep `react-native-maps`, port only the *chrome* — the dark header card, the filter row, the pin styling (category-coloured circular pins), and the selected-activity bottom card. Apply a dark map style (`customMapStyle`) so it sits inside the slate/teal palette. Expect ~85% visual match, 100% functional parity.

Also: `app/(tabs)/map.tsx` is **shared** between both apps and imports `BM_InteractiveMap`. Per the ActivCampus-first rule, split it: `components/map/AC_CampusMap.tsx` and keep `BM_InteractiveMap` for basketball, selected in `map.tsx` the same way `index.tsx` and `clubs.tsx` already switch on `appVariant`.

---

## 7. Do screens need relocating?

Mostly no — the tab IA already matches. Four changes:

| Change | From | To | Why |
|---|---|---|---|
| **Create becomes a modal** | `app/(tabs)/create.tsx` | `app/create.tsx`, `presentation: 'modal'`, launched by the nav FAB | Redesign never treats Create as a destination |
| **Society management folds in** | `app/club/[id]/manage.tsx` | Executive tab inside `app/society/[id].tsx` | Redesign has one society surface with 5 tabs |
| **Friends move under Profile** | `app/friends/search.tsx`, `app/friends/requests.tsx` as standalone routes | Content of the Profile → Friends tab (routes can stay as pushed detail views) | Redesign has no top-level friends destination |
| **New notifications surface** | — | `app/notifications.tsx` (modal), from the header bell | Backend-gated |

Unchanged: `app/event/[id].tsx`, `app/auth/*`, `app/onboarding/*`, `app/user/[id].tsx`, `app/event/invites.tsx`.

BM-only and untouched: `app/(tabs)/add-court.tsx`, `app/(tabs)/events.tsx` (already `href: null` for ActivCampus), `components/clubs/BasketballClubsScreen.tsx`, `components/BM_*`, `components/courts/*`.

---

## 8. Shared components — ActivCampus-first

Per the brief, these get the ActivCampus treatment; BM keeps working by reading tokens from the variant-aware theme rather than hardcoded orange.

`components/ui/Button.tsx` · `TextInputField.tsx` · `PillSelector.tsx` · `TabBar.tsx` · `SectionCard.tsx` · `EmptyState.tsx` · `OptionCard.tsx` · `ToggleRow.tsx` · `FormAlert.tsx` · `LoadingSpinner.tsx` · `DateTimeInput.tsx` · `TimeInput.tsx` · `ImagePicker.tsx` · `components/events/EventCard.tsx` · `app/(tabs)/map.tsx`

New components the redesign requires:

`AC_AppHeader` · `AC_BottomTabBar` (custom, floating FAB) · `AC_ClassificationBadge` · `AC_CostBadge` · `AC_FilterChipRow` (removable + reset) · `AC_SegmentedTabs` · `AC_SectionHeader` (Happening Now / Starting Soon) · `AC_AvatarStack` · `AC_GradientButton`

---

## 9. Suggested order of work

1. **Theme foundation** — variant-aware `constants/theme.ts`, ActivCampus dark tokens, fix `fontFamily` + add Inter 800/900. *Nothing else can start cleanly before this.*
2. **Navigation shell** — custom bottom tab bar with floating FAB, `AC_AppHeader`, move Create to a modal route.
3. **Activity card + Discover feed** — the highest-visibility change; delivers most of the perceived redesign.
4. **Societies list + Profile hub** — restructure into the redesign's tab layouts.
5. **Detail screens** — activity detail, society detail (absorb `club/[id]/manage.tsx`).
6. **Map chrome** — dark style + redesigned filter/pin/bottom-card, split AC from BM.
7. **Backend-gated features** — migrations for notifications, announcements, event category/tags, profile interests; then build those surfaces.
8. **Optional: light mode** — only if wanted; it roughly doubles the token surface.

---

## 10. Open questions

1. **Light mode:** the redesign ships both themes and puts a picker in Settings. Ship dark-only first, or both? (Recommend dark-only first, tokens structured to allow light later.)
2. **Societies tabs:** drop *Events* and *Managed* to match the redesign's 2-tab layout, or keep the app's 4?
3. **Migrations:** are you happy to add columns/tables for category, tags, interests, announcements and notifications? If not, those surfaces get hidden rather than built, and the feed loses its category strip and tag pills.
4. **Classification:** accept the `host_type` approximation (University/Exec/Associate), or model society-exec vs member-led properly?
5. **Society banners:** the redesign's society cards are banner-led. Add a `banner_url` column, or use generated gradient placeholders?
