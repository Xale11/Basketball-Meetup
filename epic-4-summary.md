# EPIC 4: Societies & Society Feed — Completion Summary

## Files Created / Modified

| File | Change |
|------|--------|
| `types/societies.ts` | Added `category` field to `Society`, added `SOCIETY_CATEGORIES`, `SocietyCategory`, `ADMIN_SOCIETY_ROLES` |
| `api/societies.api.ts` | Full rewrite — added `SocietyWithCount`, `getSocietyById`, `deleteSocietyMembership`, `updateSociety`; `getSocietiesByUniversityId` now includes live member counts |
| `api/events.api.ts` | Added `fetchEventsBySocietyId` |
| `hooks/societies/useFetchSocietiesByUniId.tsx` | Changed `enabled: false` → `enabled: !!universityId`; returns `SocietyWithCount[]`; added backwards-compat `fetchSocieties` alias |
| `hooks/societies/useFetchSocietyById.ts` | **New** — fetches a single society with live member count |
| `hooks/societies/useJoinSociety.ts` | **New** — mutation; invalidates `userSocieties` + `society` caches on success |
| `hooks/societies/useLeaveSociety.ts` | **New** — mutation with same cache invalidation |
| `hooks/societies/useUpdateSociety.ts` | **New** — mutation for admin profile edits; invalidates society + societies caches |
| `hooks/events/useFetchEventsBySociety.ts` | **New** — fetches upcoming, non-cancelled events for a given society |
| `components/societies/SocietiesScreen.tsx` | Discover tab wired to real API; search input; multi-select category chips; all list items navigate to society profile; Managed tab shows admin societies |
| `app/society/[id].tsx` | **New** — society profile page (see below) |

---

## User Story Outcomes

### US1 — Browse all available societies ✅
- **Discover tab** now fetches real societies via `useFetchSocietiesByUniId` (auto-fetch, no mock data).
- Each card shows: name, category badge (colour-coded), member count, description.
- **Test**: Open Societies → Discover tab. Real societies from your university should appear.

### US2 — View a society's profile page ✅
- New route at `app/society/[id].tsx`.
- Shows banner/logo (or coloured placeholder), name, category, member count, description, upcoming events.
- **Test**: Tap any society card in Discover or My Societies. Profile page should open.

### US3 — Join a society ✅
- **Join Society** button on profile page (visible for non-members).
- Calls `createSocietyMembership`; button switches to **Member ✓** on success.
- Member count and My Societies list refresh automatically.
- **Test**: Open a society you haven't joined → tap "Join Society" → button turns green.

### US4 — Leave a society ✅
- Tap **Member ✓** button to trigger a confirmation alert.
- Confirms → calls `deleteSocietyMembership`; society removed from joined list.
- **Test**: Open a joined society → tap "Member ✓" → confirm → society disappears from My Societies.

### US5 — Society events feed ✅
- **Society Events tab** already showed events from joined societies (pre-existing). Enhanced:
  - Society filter chips let you narrow by individual society.
  - My Societies cards now navigate to the society profile page.
  - Empty state with "Find a Society" CTA when not a member of any.
- **Test**: Join a society that has events → go to Societies → Society Events tab.

### US6 — Admin manage society profile ✅
- A **pencil icon** button appears in the header only for OWNER / PRESIDENT / EXEC roles.
- Edit modal allows updating: name, description, banner image (ImagePicker), category.
- Validation: empty name shows an alert and blocks save.
- Changes reflected immediately via React Query cache invalidation.
- **Test**: As a society admin, open your society profile → tap pencil → edit fields → Save Changes.

### US7 — Filter societies by category ✅
- Category chips (Sport, Social, Academic, Arts, Tech, Other) shown at top of Discover tab.
- **Multi-select**: tap multiple chips to combine filters.
- Chips + search work together (AND logic).
- Clearing chips restores the full list.
- **Test**: Discover tab → tap "Sport" chip → only Sport societies shown. Tap again to deselect.

---

## Architecture Notes
- Member count is computed from two queries in `getSocietiesByUniversityId` (no N+1): one for societies, one bulk membership count — merged in JS.
- `updateSociety` uploads new logo to `images/societies/{id}/logo.*` via the existing Supabase storage helper before persisting the URL.
- `ADMIN_SOCIETY_ROLES` is exported from `types/societies.ts` for reuse.
- All mutations follow the project pattern: named alias, `loading` flag, `onSuccess` cache invalidation.
