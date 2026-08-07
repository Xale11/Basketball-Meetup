# Code Audit — Auth, Caching & Data Freshness

Date: 2026-08-07 · Branch: `main`

Scope: `providers/`, `hooks/`, `api/`, `app/_layout.tsx`, routing/auth flow, plus a
read-only check of the Supabase project's security advisors.

Your two symptoms — **"the app doesn't stay up to date"** and **"I randomly get sent
to the login page"** — both have concrete root causes in this codebase. The login
bounce is *not* mainly a Supabase problem; it's the root layout tearing down
navigation whenever the profile query refetches. Details in P0.

---

## P0 — The login-page bounce (fix these first, in this order)

> **STATUS: fixed (items 1–8).** `AuthProvider` now owns session state only and never
> navigates; routing is declarative via `Stack.Protected` in `app/_layout.tsx`.
> Typechecked — no new errors. **Not yet run on a device.**
> One open product decision: the onboarding **Skip** button (see item 6 note).

### 1. Any background profile refetch unmounts the whole app
`app/_layout.tsx:39-41` returns `<LoadingSpinner />` — *replacing the entire `Stack`* —
whenever `loading` is true.

`AuthProvider` computes `loading: loading || userLoading` (`providers/AuthProvider.tsx:160`),
where `userLoading` comes from `useFetchById`, which defines
`loading: !!id && (query.isPending || query.isFetching)` (`hooks/users/useFetchUserById.ts:36`).

`isFetching` is true on **every background refetch**, not just the first load. So:
profile goes stale (5 min) → something triggers a refetch → `loading` flips true →
the navigation tree unmounts → spinner → remount → the redirect effect below fires.
That is the "randomly sent somewhere when I click on stuff".

**Fix:** `loading` for gating navigation must mean *"we don't yet know if there is a
session"* — nothing else. Drop `userLoading` from it entirely, and change
`useFetchById` to expose `loading: query.isPending` with `isFetching` as a separate
field. Never render a full-screen spinner off `isFetching`.

### 2. The redirect effect fires on every `user` object change and uses a stale `session`
```ts
// app/_layout.tsx:27-37
useEffect(() => {
  if (!loading && fontsLoaded) {
    if (session) { router.push('/(tabs)'); }
    else { router.replace('/auth/login'); }
  }
}, [user, loading, fontsLoaded]);   // ← reads `session`, doesn't depend on it
```
Three bugs in nine lines:
- `user` is a **new object identity** after every profile refetch → `router.push('/(tabs)')`
  runs again and again, pushing duplicate screens onto the stack.
- `session` is read but not in the dep array → stale-closure reads.
- `push` instead of `replace` on the authed branch → the back gesture returns to login.

**Fix:** delete this effect. Do route protection declaratively — an
`<Redirect href="/auth/login" />` in `app/(tabs)/_layout.tsx` when there's no session
(and the mirror of it in `app/auth/_layout.tsx`), or expo-router's `Stack.Protected`
with a `guard` prop. Guarding via imperative `router.*` calls in a `useEffect` is what
produces unpredictable navigation.

### 3. `onAuthStateChange` redirects to login on the `INITIAL_SESSION` event
```ts
// providers/AuthProvider.tsx:52-73
supabase.auth.onAuthStateChange((_event, session) => {
  ...
  if (!session) { ...; router.replace('/auth/login'); return }
})
```
`onAuthStateChange` fires immediately on subscribe with `INITIAL_SESSION`, and on a
cold start that session can be `null` before AsyncStorage rehydration completes. It
also fires for `TOKEN_REFRESHED`, `USER_UPDATED`, `PASSWORD_RECOVERY`. Redirecting on
"session is falsy" rather than on the specific event is a second source of surprise
logouts.

**Fix:** switch on `event`. Only `SIGNED_OUT` should clear state. Let the declarative
guard (item 2) handle navigation — the provider shouldn't call `router` at all.

### 4. Calling `supabase.auth.*` **inside** the `onAuthStateChange` callback
`providers/AuthProvider.tsx:56` calls `supabase.auth.getClaims()` from inside the
callback. Supabase explicitly documents this as unsupported — the auth client holds a
lock during the callback, so re-entrant calls can deadlock, which on mobile presents as
the app hanging on the spinner or the session never resolving.

**Fix:** the callback must be synchronous. Defer any Supabase call with
`setTimeout(() => {...}, 0)` / `queueMicrotask`.

### 5. `isAuth()` is broken — it always returns `true`
```ts
// providers/AuthProvider.tsx:149-158
const sesh = await supabase.auth.getSession()
if (sesh.error) return false
else if (sesh.data) return true   // ← data is ALWAYS { session: <T|null> }, always truthy
```
`data` is always a truthy object, even signed out. So every
`if (!isAuthenticated) router.replace('/auth/login')` guard across ~10 mutation hooks
is dead code. The mutation proceeds unauthenticated, hits RLS, and fails with an opaque
error instead of a clean "please sign in".

**Fix:** `return !!sesh.data.session`. Better: delete `isAuth` entirely. It costs an
AsyncStorage round-trip per mutation and duplicates state you already have — read
`session` from context and check `session?.user?.id`.

### 6. A failed profile fetch sends you to onboarding, app-wide
```ts
// hooks/users/useFetchUserById.ts:23-29
if (query.isError && !query.isFetching) router.replace("/onboarding/onboarding")
```
This hook is mounted **inside `AuthProvider`**, so it's always live. `getUserById` uses
`.maybeSingle()` and the hook throws a generic `Error` when the row is missing — which
means a **network blip, an RLS denial, and "user not onboarded" are indistinguishable**.
Any of the three, after 2 retries, yanks the user to onboarding from wherever they were.

**Fix:** have `getUserById` return `null` for "no row" and throw only for real errors.
Drive onboarding off a value (`profile === null || profile.onboarding_status !== COMPLETED`)
in the route guard, not off a query error inside a provider.

> **Note — the Skip button is now a dead end.** The guard shipped as
> `profile === null` (has no `profiles` row), which is the stricter, safer read:
> every insert in the app FKs to `profiles.id`, so a user without a row cannot
> actually use the app. But `app/onboarding/onboarding.tsx` `handleSkip` never
> creates a row, so Skip returns straight to onboarding. Previously it "worked"
> only by accident — you landed in the tabs with `user === null` and a
> half-broken session. **Decide one of:** (a) remove the Skip button, or (b) have
> Skip create a minimal `profiles` row with `onboarding_status: IN_PROGRESS` and
> loosen the guard to `profile === null` only (already the case), prompting to
> finish later. I have not changed `handleSkip`.

### 7. Races in the initial-session effect
`providers/AuthProvider.tsx:35-49`: `getSession()` and `getClaims()` each independently
call `setLoading(false)`; `getClaims()` has no `mounted` guard and no error handling
(`{ data: { claims } }` will throw on an error response); the `getSession()` `error` is
destructured and discarded. `mounted` is checked in one branch only.

**Fix:** one `loading` source of truth, set false exactly once after `getSession()`
resolves. Guard every `setState` with `mounted`.

### 8. The query cache is never cleared on sign-out
Nothing calls `queryClient.clear()` on `SIGNED_OUT`. Sign out → sign in as a different
account → the new user briefly sees the previous user's events, friends and profile
(and `staleTime: 5min` means "briefly" can be five minutes).

**Fix:** on `SIGNED_OUT`, `queryClient.clear()`. This requires the `QueryClientProvider`
to wrap `AuthProvider` (it already does in `app/_layout.tsx:69-73`), so `AuthProvider`
can call `useQueryClient()`.

---

## P1 — Why data goes stale ("doesn't refresh")

> **STATUS: fixed (items 9–15).** Key factory in `lib/queryKeys.ts`, shared client
> defaults in `lib/queryClient.ts`, AppState→focusManager bridge in
> `lib/reactQueryFocus.ts`, pull-to-refresh via `hooks/useRefreshQueries.ts`.
> Typechecked — no new errors. **Not yet run on a device.**
> Two deliberate omissions: `onlineManager`/NetInfo (needs a new dependency) and
> pull-to-refresh on the two mock-data screens (nothing to refresh).

### 9. Nothing ever refetches on app resume — verified, zero occurrences
A repo-wide search for `useFocusEffect`, `focusManager`, `onlineManager` and
`RefreshControl` across `app/` and `components/` returns **no matches**. Combined with
`refetchOnWindowFocus: false` copy-pasted into ~20 hooks, that means:

- backgrounding and reopening the app refetches nothing;
- regaining network after being offline refetches nothing;
- navigating back to a screen refetches nothing (data is cached);
- there is no pull-to-refresh anywhere.

Note that `refetchOnWindowFocus` is a **no-op in React Native** — there is no window
focus event. Setting it to `false` everywhere accomplishes nothing and hides the real
fix.

**Fix (this is the single highest-value change for freshness):**
1. Wire React Query's `focusManager` to `AppState` and `onlineManager` to
   `@react-native-community/netinfo` once, in `app/_layout.tsx`.
2. Delete every per-hook `refetchOnWindowFocus: false`.
3. Add `RefreshControl` to the events, clubs, profile and home lists, calling
   `queryClient.invalidateQueries` for that screen's keys.
4. Consider `useFocusEffect` + `invalidateQueries` on the event detail screen so
   participant counts are correct when you navigate back into it.

### 10. Two competing caches for the same fact: "am I in this event?"
| Hook | Key it writes |
|---|---|
| `useJoinLeaveEvent` (`:11`), `useUserParticipatingEvents` | `['participatingEventIds', userId]` |
| `useJoinEvent`, `useLeaveEvent`, `useUserParticipations` | `['userParticipations', userId]` |

Neither invalidates the other. Join from one screen, navigate to a screen using the
other hook, and the button still says "Join". This is a duplicated feature —
`useJoinLeaveEvent` and `useJoinEvent`+`useLeaveEvent` do the same job with different
optimistic-update shapes.

**Fix:** delete one pair (recommend keeping `useJoinEvent`/`useLeaveEvent`, since they
carry `EventParticipantStatus` and therefore support the approval-required flow), and
collapse to a single `['events','participations',userId]` key.

### 11. Missing invalidations, hook by hook
| Hook | Currently invalidates | Also needs |
|---|---|---|
| `useCreateCourt` | **nothing** | any court list/map query |
| `useCreateEvent` | `events`, `myEvents` | `societyEvents`, `participantEvents` (creator auto-joins?) |
| `useUpdateEvent` | `events`, `myEvents` | **`['event', eventId]`** — the detail screen you just edited stays stale |
| `useJoinEvent` / `useLeaveEvent` | `userParticipations`, `event` | `participatingEventIds`, `participantEvents`, `events` (capacity/counts) |
| `useJoinLeaveEvent` | `event` only | `participantEvents`, `myEvents` |
| `useRespondEventInvite` | `receivedEventInvites`, `userEventInvite` | accepting an invite **joins the event** — must invalidate participations + `['event', id]` + `participantEvents`; otherwise "Accept & Join" leaves the UI unchanged |
| `useInviteFriendToEvent` | `eventInvitees` | `eventFriends` |
| `useOnboardUser` | **nothing** | `['userFetchById', id]` — after onboarding, `AuthProvider` still holds `user === null` |
| `useSendFriendRequest` | `friendship`, `friends` | `userSearch` (the button state in search results) |
| `useUpdateProfilePhoto` / `useUpdateUser` | `userFetchById` ✓ | but see item 13 |

### 12. Query keys are ad-hoc strings across 30 files
`'userFetchById'`, `'myEvents'`, `'participatingEventIds'`, `'userParticipations'`,
`'societyEvents'`, `'eventInvitees'`… all hand-written at both the query site and every
invalidation site. A single typo silently breaks invalidation with no error — which is
almost certainly why several of the gaps in item 11 exist.

**Fix:** one `lib/queryKeys.ts` with key factories:
```ts
export const qk = {
  user: (id?: string) => ['user', id] as const,
  events: { all: ['events'] as const,
            list: (uniId?: string|null, socIds?: string[]) => ['events','list',uniId,[...(socIds??[])].sort()] as const,
            detail: (id?: string) => ['events','detail',id] as const,
            mine: (uid?: string) => ['events','mine',uid] as const },
  // …
}
```
Hierarchical keys also let one `invalidateQueries({ queryKey: qk.events.all })` cover
every event query at once.

### 13. `useUpdateUser` and `useUpdateProfilePhoto` aren't mutations
Both are hand-rolled `useState(saving)` + `try/catch/finally` around a bare API call.
They lose retry, error typing, `onError` rollback, and concurrent-call protection, and
they diverge from the pattern documented in `CLAUDE.md`. Convert to `useMutation`.

### 14. List hooks report `loading` during background refetches
`useFetchEvents`, `useFetchMyEvents`, `useFetchEvent`, `useFetchParticipantEvents` all
use `loading: query.isPending || query.isFetching`. Screens gate on this and swap the
whole list for a spinner every time data refreshes in the background. Use `isPending`
for `loading` (first load, no data yet) and expose `isFetching` separately for a subtle
indicator.

### 15. Smaller cache issues
- `useFetchUniversities` uses `enabled: false` + manual `refetch()` — an anti-pattern
  that defeats caching and dedup; `app/event/[id].tsx` calls it from an effect.
- `useFetchUserSocieties` sets no `staleTime` (so 0) while everything else uses 5 min —
  inconsistent refetch behaviour between screens.
- `useFetchEvents(user?.university_id, societyIds)` takes `societyIds` from
  `memberships.map(...)`; if membership order ever changes, the key changes and the
  cache thrashes. Sort the array inside the key factory.
- `useUserParticipations` / `useUserParticipatingEvents` build a new `Map`/`Set` on
  every render → new identity every render, defeating any downstream `memo`. Wrap in
  `useMemo`.
- `new QueryClient()` has no `defaultOptions` (`app/_layout.tsx:22`). Put `staleTime`,
  `gcTime` and `retry` there once and delete ~40 lines of repetition from the hooks.
- The `QueryClient` is created at module scope — fine, but move it out of the layout
  file into `lib/queryClient.ts` so `AuthProvider` can import it for `clear()`.

---

## P2 — Supabase / auth setup

> **STATUS: fixed (items 16–18).** Migrations written to `supabase/migrations/`
> **and applied to the live project.** Courts migrated off Firebase; `api/firebase.ts`,
> `api/utils.api.ts` and `utils/getFirebaseFilepathFromUrl.ts` deleted.
> Typechecked — no new errors. **Not yet run on a device.**
> Three deliberate carve-outs, all below: `event_tickets` left deny-all,
> `get_event_going_count` must stay executable by `authenticated`, and the
> leaked-password toggle is dashboard-only.

### 16. Live findings from the project's security advisors
- **RLS enabled with zero policies** on `public.event_images`, `public.event_tickets`,
  `public.society_roles`. This is deny-all: reads silently return `[]` and writes fail.
  If event images or society roles ever look empty when they shouldn't, this is why —
  another concrete "doesn't update" cause, not a client bug.
- `public.rls_auto_enable()` is `SECURITY DEFINER` and **executable by the `anon` role**
  over `/rest/v1/rpc/`. Anyone with your anon key can call it. Revoke `EXECUTE FROM anon, authenticated`.
- `public.create_event(...)` is `SECURITY DEFINER`, callable by `anon`, and has a
  **mutable `search_path`** — the classic privilege-escalation shape. Pin
  `SET search_path = public, pg_temp` and revoke from `anon`.
- `public.get_event_going_count(...)` is `SECURITY DEFINER` and anon-callable — probably
  intentional, but confirm.
- **Leaked-password protection is disabled** in Auth settings. One toggle in the dashboard.

Recommend running the repo's `audit-policy` skill over the full policy set once these
are addressed — the client-side `isAuth()` guards give you no security whatsoever
(item 5), so RLS is the only real boundary.

### 17. Firebase is still wired in and still doing real work
Per `CLAUDE.md`, Supabase is the only backend, but:
- `api/firebase.ts` initialises Firebase App/Auth/Firestore/Storage on import, with the
  **API key committed to the repo**.
- `api/courts.api.ts` writes courts to **Firestore** (`setDoc(doc(db,'courts',id))`) and
  images to **Firebase Storage** via `api/utils.api.ts`. Courts are not in Supabase at all.
- `app/_layout.tsx:15,30` imports Firebase auth just to `console.log(auth.currentUser)`
  — which will always be `null`, since you never sign in to Firebase.
- `app/auth/login.tsx:8` imports it and never uses it.

**Fix:** migrate `courts` to Supabase + Supabase Storage (`supabase-storage.api.ts`
already exists), then delete `api/firebase.ts`, `api/utils.api.ts` and the `firebase`
dependency. Rotate/lock down the Firebase key regardless. Note per `CLAUDE.md` naming,
courts are Basketball-Meetup-only and should be `BM_`-prefixed.

### 18. Other auth-layer notes
- `supabase.auth.getClaims()` is `@ts-ignore`d twice — you're on a `supabase-js` whose
  types don't have it. Either upgrade, or drop `claims` entirely (`session.user` and the
  `profiles` row already carry what the UI reads).
- `logout()` doesn't clear the cache or navigate; it depends entirely on the
  `onAuthStateChange` side effects being correct — see items 3 and 8.
- `AuthProvider`'s `useMemo` (`:160`) omits the five function deps; since those functions
  are re-created on every render, the memo never actually holds. Wrap each in `useCallback`,
  or accept it and drop the memo — but don't leave it half-done.
- `signUpWithEmail` returns `null` when email confirmation is pending and only
  `console.error`s. The register screen needs to handle that branch explicitly.
- `api/supabase.ts` is otherwise correct: AsyncStorage, `autoRefreshToken`,
  `persistSession`, `processLock`, and the `AppState` auto-refresh wiring are all right.
  The env-var guard is a nice touch. No changes needed here.

---

## P3 — Code quality / consistency

> **STATUS: fixed (items 19–25).** Typed errors via `lib/supabaseError.ts`, the
> `forEach(async …)` and id bugs in onboarding fixed, redundant hook boilerplate
> removed, 32 progress logs stripped, hooks standardised on named exports and
> `.ts`, and BM_ prefixes applied where the filename didn't already say it.
> Typechecked — no new errors. **Not yet run on a device.**
> Item 25 was scoped deliberately: `Basketball*`/`ActivCampus*` components already
> encode their variant, and route files under `app/` can't be renamed (the
> filename is the URL).

19. **Error handling loses the information you need.** `api/*` throws
    `new Error(JSON.stringify(error))`, which produces unreadable UI messages and drops
    `error.code` — including `42501` (RLS violation) and `23505` (unique constraint).
    `api/events.api.ts` already has the right idea in `logSupabaseError`; promote it to a
    shared `SupabaseApiError` class carrying `code`/`details`/`hint`, and use it everywhere.
    Then the mutation hooks can distinguish "not signed in" from "denied by RLS" from
    "already joined".

20. **`useOnboardUser` fires unawaited async work** (`hooks/users/useOnboardUser.tsx:79`):
    `societies.forEach(async (id) => { await createSocietyMembership(...) })` returns
    immediately. Failures are swallowed and the onboarding screen navigates to `/(tabs)`
    before the memberships exist. Use `await Promise.all(societies.map(...))`.

21. **`useOnboardUser` id inconsistency**: it validates `userId = form.id || session?.user?.id`
    but then inserts `id: session?.user?.id` (`:52`). If `form.id` is the one that's set,
    the insert goes in with `id: undefined`.

22. **Hook boilerplate.** Every hook spreads `...mutation` and *then* re-declares
    `loading`/`error`/`isSuccess`/`isError` on top. That's ~15 duplicated lines × 30 files,
    and the overrides shadow the spread silently. Extract two small factories
    (`makeQueryHook`, `makeMutationHook`) or standardise on returning only the named fields.

23. **PII in logs.** `api/users.api.ts` logs the entire profile row on every fetch
    (`console.log('getUserById data:', data)`). `useJoinLeaveEvent` logs user IDs. Strip
    these or gate behind `__DEV__`.

24. **Inconsistent module conventions.** `useFetchSocietiesByUniId`, `useFetchUserSocieties`,
    `useFetchSocietyById`, `useFetchEventsBySociety` and `useFetchUniversities` are default
    exports; every other hook is a named export. Several JSX-free hooks are `.tsx`.
    `useFetchUserSocieties` is exported both ways.

25. **Variant prefixes.** `CLAUDE.md` requires `BM_`/`AC_` prefixes on variant-specific
    code. `api/courts.api.ts`, `hooks/courts/`, `app/(tabs)/add-court.tsx`,
    `app/(tabs)/map.tsx` and `components/home/BasketballHome.tsx` are Basketball-only and
    unprefixed; `components/home/ActivCampusHome.tsx` likewise.

---

## Suggested order of work

**Phase 1 — stop the bounce (half a day).** Items 1, 2, 3, 5, 6, 7. Rewrite
`AuthProvider` so it owns *only* session state and never navigates; replace the root
`useEffect` with declarative guards in the group layouts. This alone should eliminate
the random login redirects.

**Phase 2 — make it feel live (half a day).** Items 9, 14, and `QueryClient`
`defaultOptions` (15). `focusManager` + `onlineManager` + pull-to-refresh is the biggest
perceived-quality win in the app.

**Phase 3 — correct the cache (a day).** Items 12 (key factories first — it makes 10, 11
and 13 mechanical), then 10, 11, 8, 13.

**Phase 4 — backend hygiene.** Items 16 and 17. The RLS-with-no-policy tables and the
anon-executable `SECURITY DEFINER` functions should be fixed sooner if any of those
tables are in use.

**Phase 5 — cleanup.** P3.

---

*Note: several of these changes touch shared code used by both apps. Where a fix is
variant-specific (courts/map → Basketball Meetup; societies/universities → ActivCampus),
confirm the target app before implementing.*
