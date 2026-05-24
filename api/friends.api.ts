import { supabase } from './supabase';
import {
  Friendship,
  FriendshipStatus,
  FriendshipWithFriend,
  FriendshipWithRequester,
  FriendProfile,
} from '@/types/friends';
import { User } from '@/types/user';

// ─── User Search ──────────────────────────────────────────────────────────────

/** Full-text name search over profiles, excluding the current user. */
export const searchUsers = async (
  query: string,
  currentUserId: string,
  limit = 20,
): Promise<User[]> => {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`)
      .limit(limit);
    if (error) throw new Error(JSON.stringify(error));
    return (data ?? []) as User[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

// ─── Friendship Queries ───────────────────────────────────────────────────────

/**
 * Returns the friendship row between two users regardless of which
 * sent the request (checks both orderings).
 */
export const getFriendship = async (
  userId: string,
  targetId: string,
): Promise<Friendship | null> => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`,
      )
      .maybeSingle();
    if (error) throw new Error(JSON.stringify(error));
    return data as Friendship | null;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/** Returns all ACCEPTED friendships for userId with the friend's profile. */
export const getFriends = async (userId: string): Promise<FriendshipWithFriend[]> => {
  try {
    const [{ data: sent, error: e1 }, { data: received, error: e2 }] = await Promise.all([
      supabase
        .from('friendships')
        .select('*, addressee:profiles!friendships_addressee_id_fkey(*)')
        .eq('requester_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
      supabase
        .from('friendships')
        .select('*, requester:profiles!friendships_requester_id_fkey(*)')
        .eq('addressee_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
    ]);
    if (e1) throw new Error(JSON.stringify(e1));
    if (e2) throw new Error(JSON.stringify(e2));

    return [
      ...(sent ?? []).map((f: any) => ({ ...f, friend: f.addressee as FriendProfile })),
      ...(received ?? []).map((f: any) => ({ ...f, friend: f.requester as FriendProfile })),
    ] as FriendshipWithFriend[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/** Returns incoming PENDING friend requests for userId with the requester's profile. */
export const getPendingFriendRequests = async (
  userId: string,
): Promise<FriendshipWithRequester[]> => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*)')
      .eq('addressee_id', userId)
      .eq('status', FriendshipStatus.PENDING);
    if (error) throw new Error(JSON.stringify(error));
    return (data ?? []).map((f: any) => ({
      ...f,
      requester: f.requester as FriendProfile,
    })) as FriendshipWithRequester[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/** Returns the profiles of friends who are attending (GOING) a specific event. */
export const getEventFriends = async (
  eventId: string,
  userId: string,
): Promise<FriendProfile[]> => {
  try {
    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
      supabase
        .from('friendships')
        .select('requester_id')
        .eq('addressee_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
    ]);

    const friendIds = [
      ...(sent ?? []).map((f: any) => f.addressee_id as string),
      ...(received ?? []).map((f: any) => f.requester_id as string),
    ];
    if (friendIds.length === 0) return [];

    const { data, error } = await supabase
      .from('event_participants')
      .select('profiles!event_participants_user_id_fkey(id, first_name, last_name, photo_url, university_id, course)')
      .eq('event_id', eventId)
      .eq('status', 'GOING')
      .in('user_id', friendIds);
    if (error) throw new Error(JSON.stringify(error));

    return (data ?? []).map((p: any) => p.profiles).filter(Boolean) as FriendProfile[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/**
 * Efficient bulk query: returns a Map<eventId, friendCount> for use in event feeds.
 * Avoids N+1 queries by loading all friends' participations in a single request.
 */
export const getFriendsAttendingCountMap = async (
  eventIds: string[],
  userId: string,
): Promise<Map<string, number>> => {
  try {
    if (eventIds.length === 0) return new Map();

    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase
        .from('friendships')
        .select('addressee_id')
        .eq('requester_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
      supabase
        .from('friendships')
        .select('requester_id')
        .eq('addressee_id', userId)
        .eq('status', FriendshipStatus.ACCEPTED),
    ]);

    const friendIds = [
      ...(sent ?? []).map((f: any) => f.addressee_id as string),
      ...(received ?? []).map((f: any) => f.requester_id as string),
    ];
    if (friendIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('event_participants')
      .select('event_id')
      .in('event_id', eventIds)
      .in('user_id', friendIds)
      .eq('status', 'GOING');
    if (error) throw new Error(JSON.stringify(error));

    const countMap = new Map<string, number>();
    for (const row of data ?? []) {
      countMap.set(row.event_id, (countMap.get(row.event_id) ?? 0) + 1);
    }
    return countMap;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

// ─── Friendship Mutations ─────────────────────────────────────────────────────

export const sendFriendRequest = async (
  requesterId: string,
  addresseeId: string,
): Promise<Friendship> => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: FriendshipStatus.PENDING,
      })
      .select('*')
      .maybeSingle();
    if (error) throw new Error(JSON.stringify(error));
    return data as Friendship;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export const respondToFriendRequest = async (
  friendshipId: string,
  status: FriendshipStatus.ACCEPTED | FriendshipStatus.DECLINED,
): Promise<Friendship> => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(JSON.stringify(error));
    return data as Friendship;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/** Removes a friendship or cancels a pending request (either direction). */
export const removeFriend = async (
  userId: string,
  targetId: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`,
      );
    if (error) throw new Error(JSON.stringify(error));
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

// ─── Event Invites ────────────────────────────────────────────────────────────

/** Invite a friend to an event. Caller must already be attending (GOING) or be the creator. */
export const inviteFriendToEvent = async (
  eventId: string,
  invitedUserId: string,
  invitedByUserId: string,
): Promise<void> => {
  try {
    const { error } = await supabase.from('event_invites').insert({
      event_id:            eventId,
      invited_user_id:     invitedUserId,
      invited_by_user_id:  invitedByUserId,
      status:              'PENDING',
    });
    if (error) throw new Error(JSON.stringify(error));
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

/**
 * Returns the invited_user_ids already invited to an event by invitedByUserId.
 * Used to mark already-invited friends as "Invited" in the invite picker.
 */
export const getExistingInviteeIds = async (
  eventId: string,
  invitedByUserId: string,
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('event_invites')
      .select('invited_user_id')
      .eq('event_id', eventId)
      .eq('invited_by_user_id', invitedByUserId);
    if (error) throw new Error(JSON.stringify(error));
    return (data ?? []).map((r: any) => r.invited_user_id as string);
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};
