# Epic 6: Friends & Invitations — Implementation Summary

## Overview
Full social graph feature: search students, send/accept/decline friend requests, see friends attending events, invite friends to events, and remove friends.

---

## User Stories

### US1 — Search Students by Name
**Story:** As a student, I want to search for other students so I can find and connect with them.

**How implemented:**
- `api/friends.api.ts` → `searchUsers(query, currentUserId, limit)` — `ilike` search on `first_name` and `last_name`, excludes self
- `hooks/friends/useSearchUsers.ts` — React Query hook, enabled only when `query.trim().length > 0`, `staleTime: 30s`
- `app/friends/search.tsx` — new screen with `TextInput` + debounced results in a `FlatList`; each result taps through to `/user/[id]`

**Test:** Profile → Find Friends → type a name → results appear → tap to open profile.

---

### US2 — Send Friend Requests
**Story:** As a student, I want to send friend requests to other students.

**How implemented:**
- `api/friends.api.ts` → `sendFriendRequest(requesterId, addresseeId)` — inserts PENDING row into `friendships`
- `hooks/friends/useSendFriendRequest.ts` — mutation, invalidates `['friendship', ...]` and `['friends', ...]`
- `app/user/[id].tsx` — public profile screen; shows "Add Friend" button when no relationship exists; button transitions to "Request Sent · Cancel" on success

**Test:** Search for a user → tap their profile → "Add Friend" → button becomes "Request Sent".

---

### US3 — Accept / Decline Friend Requests
**Story:** As a student, I want to accept or decline friend requests.

**How implemented:**
- `api/friends.api.ts` → `respondToFriendRequest(friendshipId, status)` — updates row to ACCEPTED or DECLINED
- `hooks/friends/useRespondFriendRequest.ts` — mutation, invalidates pending + friends + friendship queries
- `app/friends/requests.tsx` — new screen listing incoming PENDING requests with ✓ Accept and ✗ Decline buttons
- Profile screen `app/(tabs)/profile.tsx` — "Requests" button shows orange badge with count when `requestCount > 0`

**Test:** Receive a request → Profile → Requests → accept/decline → list updates.

---

### US4 — See Which Friends Are Attending an Event
**Story:** As a student, I want to see which of my friends are attending an event so I can decide to join.

**How implemented:**
- `api/friends.api.ts` → `getEventFriends(eventId, userId)` — gets friend IDs then queries `event_participants` for matches
- `hooks/friends/useEventFriends.ts` — query `['eventFriends', eventId, user?.id]`
- `components/friends/FriendsAttending.tsx` — renders up to 3 avatars + overflow badge + summary text ("Alice, Bob +2 are going"); each avatar links to `/user/[id]`
- `app/event/[id].tsx` — `FriendsAttending` rendered in the event body when `eventFriends.length > 0`
- `components/events/EventCard.tsx` — `friendsAttendingCount` prop renders "👥 N friend(s) going" in card footer

**Test:** Have friends attending an event → open event detail → "X friends going" section appears.

---

### US5 — Invite Friends to an Event
**Story:** As a student, I want to invite friends to an event I'm attending so we can participate together.

**How implemented:**
- `api/friends.api.ts` → `inviteFriendToEvent(eventId, invitedUserId, invitedByUserId)` + `getExistingInviteeIds(eventId, invitedByUserId)`
- `hooks/friends/useInviteFriendToEvent.ts` — mutation, invalidates `['eventInvitees', eventId]`
- `hooks/friends/useEventInvitees.ts` — returns `Set<string>` of already-invited user IDs
- `components/friends/InviteFriendsModal.tsx` — bottom-sheet modal showing all friends with: "Going" badge (already attending), "Invited" badge (already invited), or "Invite" button
- `app/event/[id].tsx` — "Invite Friends" button appears in the footer only when `isJoined`; tapping opens `InviteFriendsModal`

**Test:** Join an event → footer shows "Invite Friends" button → tap → modal lists friends → invite one → badge changes to "Invited".

---

### US6 — Remove a Friend
**Story:** As a student, I want to remove a friend from my network.

**How implemented:**
- `api/friends.api.ts` → `removeFriend(userId, targetId)` — deletes the friendship row in both directions using `.or()`
- `hooks/friends/useRemoveFriend.ts` — mutation, invalidates friends + friendship + pending queries
- `app/user/[id].tsx` — when status is ACCEPTED shows "Friends · Remove" button; confirmation `Alert` before deletion

**Test:** Go to a friend's profile → "Friends · Remove" → confirm → button resets to "Add Friend".

---

## New Files

| File | Purpose |
|------|---------|
| `types/friends.ts` | `FriendshipStatus` enum, `Friendship`, `FriendshipWithRequester`, `FriendshipWithFriend`, `FriendProfile` interfaces |
| `api/friends.api.ts` | All Supabase calls for the friends domain |
| `hooks/friends/useSearchUsers.ts` | People search query |
| `hooks/friends/useFriendship.ts` | Single relationship status query |
| `hooks/friends/useFriends.ts` | Full friends list query |
| `hooks/friends/usePendingRequests.ts` | Incoming requests query + count |
| `hooks/friends/useSendFriendRequest.ts` | Send request mutation |
| `hooks/friends/useRespondFriendRequest.ts` | Accept/decline mutation |
| `hooks/friends/useRemoveFriend.ts` | Remove friend mutation |
| `hooks/friends/useEventFriends.ts` | Friends attending a specific event |
| `hooks/friends/useInviteFriendToEvent.ts` | Invite mutation |
| `hooks/friends/useEventInvitees.ts` | Already-invited IDs for a event |
| `components/friends/FriendsAttending.tsx` | Avatar row + summary for event detail |
| `components/friends/InviteFriendsModal.tsx` | Bottom-sheet invite modal |
| `app/user/[id].tsx` | Public user profile with friendship actions |
| `app/friends/search.tsx` | People search screen |
| `app/friends/requests.tsx` | Incoming friend requests screen |

## Modified Files

| File | Change |
|------|--------|
| `app/(tabs)/profile.tsx` | Added My Network section (Find Friends + Requests with badge) |
| `app/event/[id].tsx` | Added FriendsAttending, InviteFriendsModal, Invite Friends footer button |
| `components/events/EventCard.tsx` | Added `friendsAttendingCount` prop |
| `app/_layout.tsx` | Registered `user` and `friends` Stack screens |
| `types/user.ts` | Added `friendships.requester_id / friendships.addressee_id` to JSDoc |

---

## Supabase Changes

### Migration: `create_friendships_table_and_policies`
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDING','ACCEPTED','DECLINED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
```

**RLS Policies on `friendships`:**

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can see their own friendships | SELECT | `requester_id = auth.uid() OR addressee_id = auth.uid()` |
| Users can send friend requests | INSERT | `requester_id = auth.uid()` (WITH CHECK) |
| Addressee can respond to requests | UPDATE | `addressee_id = auth.uid()` — can only set ACCEPTED or DECLINED |
| Users can delete their own friendships | DELETE | `requester_id = auth.uid() OR addressee_id = auth.uid()` |

### Migration: `add_event_invites_rls_policies`

**RLS Policies on `event_invites`:**

| Policy | Operation | Rule |
|--------|-----------|------|
| View invites you sent or received | SELECT | `invited_by_user_id = auth.uid() OR invited_user_id = auth.uid()` |
| Event attendees can send invites | INSERT | `invited_by_user_id = auth.uid()` + must be GOING participant |
| Invited user can update their invite | UPDATE | `invited_user_id = auth.uid()` |
| Sender can delete unsent invites | DELETE | `invited_by_user_id = auth.uid()` |

---

## Edge Cases to Test

1. **Duplicate friend request** — sending a request to someone you already have a PENDING row with should fail at the DB level (UNIQUE constraint on `requester_id, addressee_id`); API should surface a clear error message.
2. **Invite non-friend** — the invite API doesn't enforce friendship; test that a user cannot invite a stranger by calling the API directly (policy only checks the sender is an event participant).
3. **Leave event while having invited friends** — existing invites are not deleted; test that invited friends still see the invitation.
4. **Remove friend while invite is pending** — invite rows are not cascade-deleted on friendship removal; they remain valid.
5. **Accept your own friend request** — `addressee_id = auth.uid()` UPDATE policy prevents the requester from accepting their own request.
6. **Viewing a private profile** — `/user/[id]` screen currently fetches any profile; if the user has no `university_id` match, the "course" and bio fields will be blank but the screen should not crash.
7. **Friend request to yourself** — `searchUsers` excludes `currentUserId` from results; verify the profile screen also hides the "Add Friend" button when `id === user.id`.
8. **Concurrency — simultaneous accept/decline** — two sessions responding to the same request simultaneously; second update should fail gracefully.
9. **Event at capacity with invited friend** — an invite does not guarantee a spot; friend still needs to join and may hit max_participants.
10. **Notification on accept** — not yet implemented; verify the requester has no crash path waiting for a push notification that doesn't arrive.
