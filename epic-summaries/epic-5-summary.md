# Epic 5: Map & Location — Implementation Summary

## User Stories

---

### US1: As a student, I want to view a campus map with event pins so I can see where activities are taking place

**Status:** ✅ Done

**What was implemented:**
- The Map tab already rendered a Google Map with event pins via `InteractiveMap`. The missing piece was **visual differentiation by activity type (host_type)**.
- Added `HOST_TYPE_COLORS` map in `InteractiveMap.tsx`:
  - `USER` (Personal) → 🟠 Orange `#FF6B35`
  - `SOCIETY` → 🟣 Purple `#7C3AED`
  - `UNIVERSITY` → 🔵 Blue `#2563EB`
- Marker `backgroundColor` is now set dynamically from `event.host_type`.
- Added a **legend overlay** (bottom-left corner of map) showing the three colour codes.

**Files changed:** `components/InteractiveMap.tsx`

---

### US2: As a student, I want to tap a map pin to see event details so I can decide whether to join directly from the map

**Status:** ✅ Done

**What was implemented:**
- The bottom-sheet `EventPopup` already showed title, time, address, capacity and description.
- **Added "View Event" button** in the popup header — taps close the sheet and `router.push` to `/event/[id]`.
- **Wired up Join/Leave buttons** using `useJoinEvent` and `useLeaveEvent` hooks:
  - Not attending → "Join Free" / "Join · £X" (disabled while in-flight, closes modal on success)
  - Attending → "✓ Going — Leave" (green button, calls `leaveEvent`)
  - Pending approval → "Request Pending…" (grey, non-interactive)
- `participationMap` is now passed from `map.tsx` → `InteractiveMap` → `EventPopup`.
- Added host type badge (e.g. "Society") alongside the cost badge.

**Files changed:** `components/InteractiveMap.tsx`, `app/(tabs)/map.tsx`

---

### US3: As a student, I want to filter events on the map by activity type so I can narrow down what I'm looking for

**Status:** ✅ Done

**What was implemented:**
- Added a third filter group in `map.tsx`: **All / Personal / Society / University**.
- These map to `EventHostType.USER / SOCIETY / UNIVERSITY` respectively.
- The existing `filteredEvents` memo now includes a `matchesActivity` check.
- Active activity chips use the same colour as their map markers (orange, purple, blue) to visually connect the filter to the legend.
- Filter state (`activityFilter`) persists while on the Map tab.
- Clearing back to "All" restores all pins.

**Files changed:** `app/(tabs)/map.tsx`

---

### US4: As a student, I want to see my current location on the campus map so I can find events closest to where I am

**Status:** ✅ Already implemented (no changes needed)

**Existing behaviour:**
- `expo-location` permission is requested on first mount of `InteractiveMap`.
- `showsUserLocation={true}` displays the blue location dot.
- Map centres on user location on first load.
- Orange Navigation button re-centres the map at any time.

---

### US5: As a student, I want to set a venue location when creating an event so attendees know exactly where to go

**Status:** ✅ Already implemented (no changes needed)

**Existing behaviour:**
- `app/(tabs)/create.tsx` uses `react-native-google-places-autocomplete` to search and select a venue.
- `address`, `latitude`, and `longitude` are extracted from the Places API response and stored on the event row.
- Events without coordinates are excluded from map markers (`e.latitude != null && e.longitude != null` guard).

---

## Policies Created or Modified

No Supabase schema or RLS policy changes were required for Epic 5. All data (events, participants) is read through existing policies established in earlier epics.

---

## Edge Cases to Test

1. **Events with no coordinates** — should not appear as pins on the map (guard already in place).
2. **Location permission denied** — map should still load, but no blue dot or location re-centring. Currently the map just doesn't set a region, so it shows a default world view; consider a campus-centre fallback coordinate.
3. **Joining an APPROVAL_REQUIRED event from the map** — button should switch to "Request Pending…" immediately (optimistic update in `useJoinEvent`).
4. **Joining a paid event from the map** — the Join button shows the price and uses a dark background. A ticketing/payment flow is not yet implemented, so this button currently just calls `joinEvent` as if it were free. Mark this as a known limitation until the payments epic is built.
5. **Activity filter + time filter combined** — ensure both filters apply simultaneously (they do, via the AND logic in `filteredEvents`).
6. **"View Event" on a cancelled event** — the event detail page should show the cancelled state; the map does not currently filter out `is_cancelled: true` events, so they still appear as pins.
7. **Map re-render when filter changes** — confirm markers update instantly when switching activity chips.
8. **Leaving an event from the map popup** — should close the popup and remove the GOING status (optimistic update). Re-opening the popup should show the Join button again.
