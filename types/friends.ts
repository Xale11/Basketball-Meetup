/**
 * Supabase table: friendships
 * Bidirectional friend relationship stored as a single directed row per pair.
 * The UNIQUE constraint is on (requester_id, addressee_id) — only one row per
 * ordered pair exists. Application code must query both directions to determine
 * whether two users are friends (see api/friends.api.ts helpers).
 * FK: requester_id → profiles.id, addressee_id → profiles.id.
 * Status lifecycle: PENDING → ACCEPTED | DECLINED
 */
export enum FriendshipStatus {
  PENDING  = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

/** Supabase table: friendships — core row */
export interface Friendship {
  id:            string;
  requester_id:  string;
  addressee_id:  string;
  status:        FriendshipStatus;
  created_at:    string;
  updated_at:    string;
}

/** Friendship joined with the requester's public profile. Used for incoming-request lists. */
export interface FriendshipWithRequester extends Friendship {
  requester: FriendProfile;
}

/** Friendship joined with the friend's public profile. Used for friends-list queries. */
export interface FriendshipWithFriend extends Friendship {
  friend: FriendProfile;
}

/** Subset of profiles columns relevant to social features. */
export interface FriendProfile {
  id:            string;
  first_name:    string | null;
  last_name:     string | null;
  photo_url:     string | null;
  university_id: string | null;
  course:        string | null;
}
