# ActivCampus UI Redesign — Delivery Plan

Companion to [`ACTIVCAMPUS_UI_REDESIGN.md`](./ACTIVCAMPUS_UI_REDESIGN.md), which holds the findings and rationale. This file is the execution breakdown: 26 tickets across 8 phases, with dependencies, acceptance criteria and estimates.

**Scope reminder:** ActivCampus only. Shared components adopt the ActivCampus look; Basketball Meetup keeps its orange palette via the variant-aware theme built in AC-01.

---

## Estimate at a glance

| Phase | Tickets | Dev-days |
|---|---|---|
| **0 — Foundation** | AC-01 … AC-04 | **6.0** |
| **1 — Navigation shell** | AC-05 … AC-07 | **3.0** |
| **2 — Discover feed & activity card** | AC-08 … AC-11 | **7.5** |
| **3 — Societies & Profile** | AC-12 … AC-16 | **9.5** |
| **4 — Detail screens & create form** | AC-17 … AC-19 | **6.5** |
| **5 — Map** | AC-20 | **2.5** |
| | **Core visual redesign subtotal** | **35.0** |
| **6 — Backend-gated features** | AC-21 … AC-26 | **11.0** |
| **7 — Light mode (committed)** | AC-27 | **4.0** |
| | **Full scope** | **50.0** |

Estimates are **focused dev-days for one developer**, hand-writing React Native. They cover implementation + self-test on one platform. They do **not** include cross-platform QA, design review cycles, or bug-fix tail — see [Calendar scenarios](#calendar-scenarios).

---

## Phase 0 — Foundation

Everything downstream depends on this. Do not start Phase 1 until AC-01 is merged.

### AC-01 · Variant-aware theme tokens — **1.5d**
Replace the flat `Colors` enum in `constants/theme.ts` with two token sets selected by `appVariant`.

- Create `constants/theme/activCampus.ts` (dark slate + teal/emerald tokens from §3 of the findings) and `constants/theme/basketball.ts` (today's orange/light values, extracted from the hardcoded hexes currently scattered inline).
- Export a single `theme` object: colours, radii, spacing scale, shadow presets, gradient definitions.
- **Do not** mass-migrate screens yet — that happens per-ticket.

**Acceptance:** `theme` resolves correctly for both `EXPO_PUBLIC_APP_VARIANT` values; both apps still build and render unchanged.
**Depends on:** nothing.

### AC-02 · Fix typography — **0.5d**
Inter is loaded in `app/_layout.tsx` but `fontFamily` appears **zero times** in the codebase, so nothing uses it.

- Add `Inter_800ExtraBold` and `Inter_900Black` to `useFonts` (the redesign uses 800/900 on nearly every heading, badge and button).
- Add a `typography` block to the theme: named styles (`h1`, `h2`, `cardTitle`, `badge`, `microLabel`, `body`, `caption`) each setting **explicit `fontFamily`**, not just `fontWeight`.

**Acceptance:** headings render in Inter on both iOS and Android; weight 800 visibly differs from 700 on Android.
**Depends on:** AC-01.

### AC-03 · Restyle UI primitives — **2.0d**
Migrate `components/ui/*` off hardcoded hexes onto theme tokens: `Button`, `TextInputField`, `PillSelector`, `TabBar`, `SectionCard`, `EmptyState`, `OptionCard`, `ToggleRow`, `FormAlert`, plus `LoadingSpinner`.

**Acceptance:** zero hardcoded colour literals remain in `components/ui/*`; Basketball Meetup renders identically to before; ActivCampus renders dark.
**Depends on:** AC-01, AC-02.

### AC-04 · New shared design-system components — **2.0d**
Build the pieces the redesign leans on that have no equivalent today:

`AC_ClassificationBadge` (University/Exec/Associate) · `AC_CostBadge` (Free / £n.nn) · `AC_GradientButton` (teal→emerald, `expo-linear-gradient`) · `AC_SegmentedTabs` · `AC_FilterChipRow` (removable chips + "Reset All") · `AC_SectionHeader` (Happening Now / Starting Soon variants) · `AC_AvatarStack` (overlapping friend avatars)

**Acceptance:** each renders in isolation matching the redesign's spec; all consume theme tokens only.
**Depends on:** AC-01, AC-02.

---

## Phase 1 — Navigation shell

Small phase, large perceived impact — this is what makes the app *feel* redesigned.

### AC-05 · Custom bottom tab bar with floating FAB — **1.5d**
Replace the default `Tabs` bar in `app/(tabs)/_layout.tsx` with a custom `tabBar` render prop. The centre (+) is a 56px gradient circle floating **above** the bar with a 4px canvas-coloured ring — this overflows the bar's bounds and cannot be done with `tabBarIcon` alone.

- Relabel for ActivCampus: `Home → Discover`, `Clubs → Societies`.
- Preserve the existing `ProfileTabIcon` unread badge (friend requests + event invites).
- Blur backdrop via `expo-blur`.

**Acceptance:** 5 slots render for ActivCampus (Discover · Map · + · Societies · Profile); BM's 6-tab layout still works; FAB is tappable where it overflows on both platforms.
**Depends on:** AC-01, AC-04.

### AC-06 · `AC_AppHeader` — **1.0d**
Shared sticky header: logo, "…ac.uk Verified" pill, notification bell with unread count, avatar. Rendered by each of the four ActivCampus tab screens.

- Bell target is stubbed until AC-23; interim, wire it to the existing friend-request + event-invite counts.
- Port the redesign's `Logo.tsx` SVG to `react-native-svg` (already a dep).

**Acceptance:** header appears on Discover, Map, Societies, Profile with correct safe-area inset; avatar taps through to Profile.
**Depends on:** AC-01, AC-02.

### AC-07 · Relocate Create to a modal route — **0.5d**
Move `app/(tabs)/create.tsx` → `app/create.tsx` with `presentation: 'modal'`. The nav FAB pushes it. Register under the signed-in `Stack.Protected` group in `app/_layout.tsx`.

**Acceptance:** FAB opens Create as a dismissible modal; the empty-titled tab route is gone; deep links still resolve.
**Depends on:** AC-05.

---

## Phase 2 — Discover feed & activity card

The highest-visibility phase. After this, the app reads as redesigned.

### AC-08 · Activity card restyle — **2.0d**
Rebuild `components/events/EventCard.tsx` to the redesign's shell: banner image with gradient scrim → classification badge top-left → cost badge top-right → title → organiser row → **inset dark info block** (time range, location) → footer (availability · `View details` · `Join`).

- **Keep all existing logic** — join/leave/request states, invite-only handling, `useJoinEvent`/`useLeaveEvent`.
- Wire `events.banner_image_url` (exists, currently unused by the card).
- Category/tag pills deferred to AC-21.
- Derive classification from `host_type` (`UNIVERSITY→University`, `SOCIETY→Exec`, `USER→Associate`).
- **Delete** dead files `components/EventCard.tsx` and `components/ClubCard.tsx` — nothing imports them.

**Acceptance:** card matches the redesign minus category/tag pills; all join states behave as before; BM's usage still renders correctly.
**Depends on:** AC-03, AC-04.

### AC-09 · Discover feed restructure — **2.5d**
Rework `components/home/ActivCampusHome.tsx`:

- Time tabs become **Today / Tomorrow / This Week** (`AC_SegmentedTabs`). The redesign has no "Now" tab — *Happening Now* is a section inside Today.
- Today splits into **Happening Now → Starting Soon (next 2h) → Later Today**. Existing `isHappeningNow` logic survives; add the 2h bucket.
- This Week groups by day with **sticky date headers** — convert to `SectionList` with `stickySectionHeadersEnabled`.
- Do **not** port the redesign's "Device Frame Mode" toggle — it's prototype scaffolding.

**Acceptance:** all three tabs render correct buckets; sticky headers work while scrolling; pull-to-refresh preserved.
**Depends on:** AC-08.

### AC-10 · Search & filter chip row — **1.5d**
- Make the header search functional (title, location, organiser, society name).
- Organiser filter: All / University / Exec / Associate, mapped from `host_type`.
- Cost filter retained; add max-price control for Paid.
- Removable active-filter chip row + "Reset All" via `AC_FilterChipRow`.
- Category strip is built but **hidden behind a flag** until AC-21 lands.

**Acceptance:** filters compose correctly; every active filter shows a removable chip; Reset All clears to defaults.
**Depends on:** AC-04, AC-09.

### AC-11 · Availability & friends-attending — **1.5d**
- Extend `useFetchEvents` with an `event_participants(count)` aggregate to drive "n places remaining" / "Fully Booked" against the existing `max_participants`.
- Wire `components/friends/FriendsAttending.tsx` into the card as an `AC_AvatarStack`; `EventCard` already accepts a `friendsAttendingCount` prop that the feed never passes.

**Acceptance:** counts are correct and don't N+1; avatar row only shows the viewer's accepted friends.
**Depends on:** AC-08.

---

## Phase 3 — Societies & Profile

The two biggest structural rewrites.

### AC-12 · Societies list restructure — **2.5d**
`components/societies/SocietiesScreen.tsx` (801 lines) keeps its **4** tabs (Society Events / Discover / My Societies / Managed) and is restyled to the redesign's visual language.

- Gradient hero banner + "Create Society" CTA.
- Keep the existing search + category chips.
- Logo **and** banner pickers in the create-society modal (the single picker was
  labelled "Banner" but bound to the logo).

**Acceptance:** hero banner and restyled cards render; all 4 tabs still work; create-society flow intact.
**Depends on:** AC-03, AC-04.

> **Decision (closes open question 2): keep all 4 tabs.** The redesign's 2-tab
> layout was not adopted. This ticket is therefore a restyle — hero, tokens,
> `SegmentedTabs`, card treatment — not a restructure, so actual scope came in
> below the 2.5d estimate.

### AC-13 · Society card — **1.5d**
Banner-led card: banner image, role badge (President/Committee/Member), logo, name + verified tick, member count, description, **"Next Activity" inset box**, footer actions (`View activities` · `Leave`/`+ Join` · `View society →`).

- Member count computed from `society_memberships`.
- Banner and verified tick are **blocked** (AC-25) — ship with a gradient placeholder keyed on society id.

**Acceptance:** card matches the redesign apart from the banner placeholder; role badge reflects the viewer's actual `role_id`.
**Depends on:** AC-12.

### AC-14 · Profile hub shell + My Activity tab — **2.0d**
Convert `app/(tabs)/profile.tsx` from a single scroll of `SectionCard`s into a **4-tab hub**. This ticket delivers the shell, the redesigned profile header card, and tab 1.

- Tab 1 sub-tabs: `Upcoming (n) / Created by Me (n) / Past (n)` — `ActivitySection` already fetches `myEvents` + `participantEvents`; only needs an upcoming/past split by date.
- Header shows name, email, stats row. Degree/year/verified pill deferred to AC-26.

**Acceptance:** 4 tabs navigable; activity counts correct; existing photo-upload flow preserved.
**Depends on:** AC-04, AC-08.

### AC-15 · Profile → Friends tab — **1.5d**
Fold `My Network` + `Event Invites` cards into tab 2.

- **Keep the app's real friend-request flow.** The redesign's "add by email, instantly connected" is mock behaviour and a functional downgrade.
- `friends/search` and `friends/requests` stay as pushed routes, reached from this tab.

**Acceptance:** connections grid renders; request/invite counts match the tab-bar badge; both sub-routes still reachable.
**Depends on:** AC-14.

### AC-16 · Profile → Settings tab — **2.0d**
Replace the dead menu list (`Payment Methods`, `Notifications`, `Privacy & Security`, `Settings` are all `onPress: () => {}`).

- Bio editor with 150-char counter (reuse `EditProfileModal` logic inline).
- Email-verified row, push-notification toggle.
- Change-password form via `supabase.auth.updateUser`.
- Theme picker rendered but disabled until AC-27; log out retained.

**Acceptance:** bio saves and persists; password change succeeds against Supabase and surfaces errors; no dead menu rows remain.
**Depends on:** AC-14.

---

## Phase 4 — Detail screens & create form

### AC-17 · Activity detail restyle — **1.5d**
`app/event/[id].tsx` (437 lines). The app's version is already richer than the redesign's modal — restyle only, keep as a pushed route (better back gesture, deep links matter).

**Acceptance:** visual match; all existing actions (join, leave, invite, share) preserved.
**Depends on:** AC-03, AC-04, AC-08.

### AC-18 · Society detail — 5 tabs — **3.0d**
`app/society/[id].tsx` gains **Activities** (with all/exec/associate filter) · **Overview** · **Announcements** · **Members** · **Executive**.

- Executive tab gated on the viewer's `role_id` being in `ADMIN_SOCIETY_ROLES` (constant already exists in `types/societies.ts`).
- Executive tools: edit society profile, promote/demote members, host an official activity.
- Announcements tab is **blocked** (AC-24) — render an empty state.
- Grant budget / compliance status: out of scope.

> **Correction (was: "absorb `app/club/[id]/manage.tsx`").** That file is not
> society management — it is Basketball Meetup scaffolding driven by `mockClubs`
> (players / sessions / payments / settings), reachable only by direct URL and
> referenced nowhere in the app. The original audit misread it. It belongs to BM
> and is left untouched; the Executive tab was built fresh from the redesign.

**Acceptance:** 5 tabs render; Executive hidden for non-admins.
**Depends on:** AC-13, AC-17.

### AC-19 · Create modal form restyle — **2.0d**
Restyle `app/create.tsx` (521 lines) to the redesign's form. Adds a duration hint and a Free/Paid cost section; tags and classification pickers are deferred to AC-21.

- Do **not** entangle with `components/events/EventFormModal.tsx` (653 lines) — that is BM-only, used by the `events` tab.
- Restyle `DateTimeInput` / `TimeInput` / `ImagePicker` as part of this ticket.
- The screen is a presented modal since AC-07, so it needs its own close affordance — Android has no swipe-to-dismiss.

> **Scope note.** The redesign's *cost-split* toggle is not built: there is no
> column to persist it and no settlement logic behind it, so it would be a
> control that silently does nothing. Free/Paid + `price_from` is built, which
> is what `events` can actually store.

**Acceptance:** form submits successfully; validation and error states match the redesign's treatment; the recent number-pad-over-picker fix is not regressed.
**Depends on:** AC-07, AC-03.

---

## Phase 5 — Map

### AC-20 · Split AC/BM map + dark chrome — **2.5d**
`app/(tabs)/map.tsx` is currently **shared** and imports `BM_InteractiveMap`. Split it the way `index.tsx` and `clubs.tsx` already switch on `appVariant`.

- New `components/map/AC_CampusMap.tsx`; `BM_InteractiveMap` stays for basketball.
- Keep `react-native-maps` — port only the *chrome*: dark header card, filter row, category-coloured circular pins, selected-activity bottom card, `customMapStyle` for the slate/teal palette.
- The redesign's hand-drawn SVG campus with %-coordinate landmarks **cannot** represent real lat/lng. Expect ~85% visual match, 100% functional parity.

**Acceptance:** ActivCampus map renders dark with redesigned pins; BM map unchanged; pin tap opens the bottom card.
**Depends on:** AC-08.

---

## Phase 6 — Backend-gated features

Each ticket includes its Supabase migration. Gated on open question 3.

### AC-21 · Event category & tags — **2.0d**
Migration: `events.category text`, `events.tags text[]`. Add the category enum to `types/event.ts`, backfill existing rows, surface the category pill strip in Discover (unhide from AC-10), tag chips on the card, and both pickers in the create form.
**Depends on:** AC-10, AC-19.

### AC-22 · Profile interests — **1.5d**
Migration: `profiles.interests text[]`. Build Profile tab 3 (8 toggleable category cards). Optionally feed a "For You" ordering into Discover.
**Depends on:** AC-14, AC-21.

### AC-23 · Notifications — **3.0d**
New table `notifications (id, user_id, type, title, message, read, event_id, created_at)` + RLS. Build `app/notifications.tsx` as a modal, wire the `AC_AppHeader` bell with a real unread count and "Mark all read". Emit notifications on join / invite / approval.
**Depends on:** AC-06.

### AC-24 · Society announcements — **2.5d**
New table `society_announcements (id, society_id, author_id, title, content, is_important, created_at)` + RLS (admins write, members read). Fill the Announcements tab and the Executive tab's post-announcement form.
**Depends on:** AC-18.

### AC-25 · Society banner & verification — **1.0d**
Migration: `societies.banner_url`, `societies.verified_official`. Replace AC-13's gradient placeholder; add banner upload to the create/edit society flow.
**Depends on:** AC-13.

### AC-26 · Profile degree, year & verified badge — **1.0d**
Migration: `profiles.degree`, `profiles.year_of_study`. Derive the "Verified Student" pill from `university_id` + email domain. Add fields to onboarding and profile edit.
**Depends on:** AC-14.

---

## Phase 7 — Light mode

### AC-27 · Light mode — **4.0d**
The redesign ships a full light theme (a ~300-line CSS override sheet) with a picker in Settings. In RN this means a second complete token set plus an audit of every screen for hardcoded values, and it roughly doubles the token surface. Enables the AC-16 theme picker; persist to AsyncStorage.

**Status: committed — not optional.** It stays last in the sequence, but it is a shipping requirement, so every earlier phase must be built mode-ready (see [Theming constraint](#theming-constraint)). Doing so turns this ticket from 'audit and refactor every screen' into 'author a second token set and mount a provider'.
**Depends on:** all of Phases 0–5.

---

## Dependency map

```
AC-01 ─┬─ AC-02 ─┬─ AC-03 ─┬─────────────────────── AC-12 ── AC-13 ──┬── AC-25
       │         │         ├── AC-17 ──┐                             │
       └─ AC-04 ─┴─ AC-05 ─┴─ AC-06 ───┼─────────────── AC-23        │
                    │                  │                             │
                    └─ AC-07 ── AC-19 ─┼── AC-21 ── AC-22            │
                                       │                             │
                       AC-08 ─┬─ AC-09 ┴─ AC-10                      │
                              ├─ AC-11                               │
                              ├─ AC-20                               │
                              └─ AC-14 ─┬─ AC-15                     │
                                        ├─ AC-16 ── AC-27            │
                                        └─ AC-26                     │
                                                    AC-18 ── AC-24 ──┘
```

**Critical path:** AC-01 → AC-02 → AC-04 → AC-08 → AC-14 → AC-18 → AC-24.

---

## Calendar scenarios

The dev-day figures above are focused implementation time. Real calendar time needs a **~35% overhead** for cross-platform QA (iOS + Android), design review cycles, and the bug tail — RN styling in particular tends to need a second pass on the platform you didn't develop against.

| Scenario | Core (Ph 0–5) | Full (Ph 0–6) | + Light mode |
|---|---|---|---|
| **Solo dev, full-time, hand-written** | ~47 days ≈ **9–10 weeks** | ~67 days ≈ **13–14 weeks** | ≈ **15 weeks** |
| **Solo dev, full-time, heavy Claude Code use** | ≈ **6 weeks** | ≈ **8–9 weeks** | ≈ **10 weeks** |
| **Solo dev, ~2 days/week** | ≈ **5–6 months** | ≈ **8 months** | — |

On the AI-assisted row: the mechanical Tailwind→StyleSheet translation compresses a lot (call it 50–60% faster), but review, QA, migrations and design-fidelity iteration barely compress at all. That's why the saving is ~35% overall rather than the ~55% the raw coding suggests.

### Thinnest shippable slice

If the goal is for the app to **look** redesigned as early as possible, **Phases 0–2 (AC-01 … AC-11, 16.5 dev-days ≈ 3 weeks solo, ~2 weeks AI-assisted)** deliver the theme, the navigation shell, and the Discover feed — which is where users spend most of their time and where most of the perceived change lives. Societies, Profile and detail screens would look half-migrated until Phase 3–4 land, so plan to ship 0–4 together if you want a coherent release.

---

## Before starting

Five decisions from §10 of the findings doc gate specific tickets:

1. ~~**Light mode now or later?**~~ → **DECIDED: committed, built last.** Not optional. Sequenced after Phase 5, but every phase before it must be built mode-ready — see [Theming constraint](#theming-constraint)
2. ~~**Societies: 2 tabs or keep 4?**~~ → **DECIDED: keep all 4, restyle only.** The Events and Managed tabs stay; AC-12 is a visual restyle, not a restructure.
3. **Willing to run migrations?** → the whole of Phase 6. If no, those surfaces get hidden rather than built, and the feed permanently loses its category strip and tag pills
4. **Accept the `host_type` classification approximation?** → AC-08, AC-10
5. **Society banners: add a column or use gradient placeholders?** → AC-13, AC-25

---

## Theming constraint

Light mode (AC-27) is **committed, not optional**. It is built last, but every
phase before it must leave it plug-in-able. This section is the standing rule.

### The problem it avoids

The original pattern reads tokens at *module load* and bakes them into a sheet:

```ts
const { colors } = theme;                               // resolved at import
const styles = StyleSheet.create({                      // baked at import
  card: { backgroundColor: colors.surface },
});
```

A sheet built this way can never see a mode change. Left unchecked, AC-27's
real cost is not the second palette — it is rewriting every component that
froze its colours at import time.

### The rule for new work

Build styles from the active theme, inside the component:

```ts
import { useThemedStyles } from '@/hooks/useTheme';

const makeStyles = (t: Theme) =>                        // module scope: stable identity
  StyleSheet.create({
    card: { backgroundColor: t.colors.surface, borderRadius: t.radius.card },
  });

export function Card() {
  const s = useThemedStyles(makeStyles);
  return <View style={s.card} />;
}
```

- **Never** add a new module-scope `const { colors } = theme`.
- **Never** hardcode a colour literal. If a token is missing, add it to
  `types.ts` **and both** `activCampus.ts` and `basketball.ts`.
- Branch on `theme.dark`, not on `appVariant`, for anything light/dark-shaped
  (status bar style, keyboard appearance, blur tint, image scrims).
- Tokens resolve through `resolveTheme(variant, mode)` in
  `constants/theme/index.ts` — adding light means adding a table entry.

### Migrating what already exists

24 files still destructure `theme` at module scope. They are **not** being
converted in one pass; each phase converts the screens it already touches, so
the debt clears along the way rather than as a separate project. Track it with:

```bash
grep -rln "^const {.*} = theme;" components/ app/
```

### What AC-27 is then left with

1. Author `constants/theme/activCampus.light.ts` and add it to `THEMES`.
2. Mount a provider above the app that owns `mode`, persists it to
   AsyncStorage, and optionally follows `useColorScheme()`.
3. Wire the AC-16 Settings picker to `setMode`.
