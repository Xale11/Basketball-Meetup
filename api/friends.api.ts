import { supabase } from './supabase';
import {
  Friendship,
  FriendshipStatus,
  FriendshipWithFriend,
  FriendshipWithRequester,
  FriendProfile,
} from '@/types/friends';
import { User } from '@/types/user';
import { EventInvite, EventInviteStatus, ReceivedEventInvite } from '@/types/event';
import { throwSupabaseError } from '@/lib/supabaseError';

// Note: no outer try/catch anywhere in this file. The previous
// `catch (error) { throw new Error(JSON.stringify(error)) }` wrappers destroyed
// the error — JSON.stringify of an Error instance is "{}" — so every failure
// surfaced as an empty object and the Postgres code was lost.

// ─── User Search ──────────────────────────────────────────────────────────────

/** Full-text name search over profiles, excluding the current user. */
export const searchUsers = async (
  query: string,
  currentUserId: string,
  limit = 20,
): Promise<User[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`)
    .limit(limit);
  if (error) throwSupabaseError('friends.api searchUsers', error);
  return (data ?? []) as User[];
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
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`,
    )
    .maybeSingle();
  if (error) throwSupabaseError('friends.api getFriendship', error);
  return data as Friendship | null;
};

/** Returns all ACCEPTED friendships for userId with the friend's profile. */
export const getFriends = async (userId: string): Promise<FriendshipWithFriend[]> => {
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
  if (e1) throwSupabaseError('friends.api getFriends (sent)', e1);
  if (e2) throwSupabaseError('friends.api getFriends (received)', e2);

  return [
    ...(sent ?? []).map((f: any) => ({ ...f, friend: f.addressee as FriendProfile })),
    ...(received ?? []).map((f: any) => ({ ...f, friend: f.requester as FriendProfile })),
  ] as FriendshipWithFriend[];
};

/** Returns incoming PENDING friend requests for userId with the requester's profile. */
export const getPendingFriendRequests = async (
  userId: string,
): Promise<FriendshipWithRequester[]> => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', userId)
    .eq('status', FriendshipStatus.PENDING);
  if (error) throwSupabaseError('friends.api getPendingFriendRequests', error);
  return (data ?? []).map((f: any) => ({
    ...f,
    requester: f.requester as FriendProfile,
  })) as FriendshipWithRequester[];
};

/** Returns the profiles of friends who are attending (GOING) a specific event. */
export const getEventFriends = async (
  eventId: string,
  userId: string,
): Promise<FriendProfile[]> => {
  const [{ data: sent, error: e1 }, { data: received, error: e2 }] = await Promise.all([
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
  // These two errors were previously discarded entirely, so an RLS failure here
  // silently produced "no friends attending" rather than an error.
  if (e1) throwSupabaseError('friends.api getEventFriends (sent)', e1);
  if (e2) throwSupabaseError('friends.api getEventFriends (received)', e2);

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
  if (error) throwSupabaseError('friends.api getEventFriends', error);

  return (data ?? []).map((p: any) => p.profiles).filter(Boolean) as FriendProfile[];
};

/**
 * The viewer's friends attending each of `eventIds`, keyed by event.
 *
 * Returns the profiles rather than a bare count so the feed can render the
 * avatar stack; callers that only need a number read `.length`. Still one bulk
 * round trip for the whole feed — the profile embed rides along on the
 * participation query that was already being made.
 */
export const getFriendsAttendingMap = async (
  eventIds: string[],
  userId: string,
): Promise<Map<string, FriendProfile[]>> => {
  if (eventIds.length === 0) return new Map();

  const [{ data: sent, error: e1 }, { data: received, error: e2 }] = await Promise.all([
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
  if (e1) throwSupabaseError('friends.api getFriendsAttendingMap (sent)', e1);
  if (e2) throwSupabaseError('friends.api getFriendsAttendingMap (received)', e2);

  const friendIds = [
    ...(sent ?? []).map((f: any) => f.addressee_id as string),
    ...(received ?? []).map((f: any) => f.requester_id as string),
  ];
  if (friendIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('event_participants')
    .select(
      'event_id, profiles!event_participants_user_id_fkey(id, first_name, last_name, photo_url, university_id, course)',
    )
    .in('event_id', eventIds)
    .in('user_id', friendIds)
    .eq('status', 'GOING');
  if (error) throwSupabaseError('friends.api getFriendsAttendingMap', error);

  const map = new Map<string, FriendProfile[]>();
  for (const row of (data ?? []) as any[]) {
    // The embed is an object here (many-to-one), but a row whose profile is
    // unreadable comes back null rather than being dropped.
    const profile = row.profiles as FriendProfile | null;
    if (!profile) continue;
    const existing = map.get(row.event_id);
    if (existing) existing.push(profile);
    else map.set(row.event_id, [profile]);
  }
  return map;
};

// ─── Friendship Mutations ─────────────────────────────────────────────────────

export const sendFriendRequest = async (
  requesterId: string,
  addresseeId: string,
): Promise<Friendship> => {
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: FriendshipStatus.PENDING,
    })
    .select('*')
    .maybeSingle();
  if (error) throwSupabaseError('friends.api sendFriendRequest', error);
  return data as Friendship;
};

export const respondToFriendRequest = async (
  friendshipId: string,
  status: FriendshipStatus.ACCEPTED | FriendshipStatus.DECLINED,
): Promise<Friendship> => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .select('*')
    .maybeSingle();
  if (error) throwSupabaseError('friends.api respondToFriendRequest', error);
  return data as Friendship;
};

/** Removes a friendship or cancels a pending request (either direction). */
export const removeFriend = async (
  userId: string,
  targetId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`,
    );
  if (error) throwSupabaseError('friends.api removeFriend', error);
};

// ─── Event Invites ────────────────────────────────────────────────────────────

/** Invite a friend to an event. Caller must already be attending (GOING) or be the creator. */
export const inviteFriendToEvent = async (
  eventId: string,
  invitedUserId: string,
  invitedByUserId: string,
): Promise<void> => {
  const { error } = await supabase.from('event_invites').insert({
    event_id: eventId,
    invited_user_id: invitedUserId,
    invited_by_user_id: invitedByUserId,
    status: 'PENDING',
  });
  if (error) throwSupabaseError('friends.api inviteFriendToEvent', error);
};

/**
 * Returns the invited_user_ids already invited to an event by invitedByUserId.
 * Used to mark already-invited friends as "Invited" in the invite picker.
 */
export const getExistingInviteeIds = async (
  eventId: string,
  invitedByUserId: string,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('event_invites')
    .select('invited_user_id')
    .eq('event_id', eventId)
    .eq('invited_by_user_id', invitedByUserId);
  if (error) throwSupabaseError('friends.api getExistingInviteeIds', error);
  return (data ?? []).map((r: any) => r.invited_user_id as string);
};

/**
 * Fetch all PENDING event invites received by userId, with event details and inviter profile.
 */
export const getReceivedEventInvites = async (userId: string): Promise<ReceivedEventInvite[]> => {
  const { data, error } = await supabase
    .from('event_invites')
    .select(`
      *,
      event:events!event_invites_event_id_fkey (id, name, start_date, end_date, address),
      invited_by:profiles!event_invites_invited_by_user_id_fkey (id, first_name, last_name, photo_url)
    `)
    .eq('invited_user_id', userId)
    .eq('status', 'PENDING');
  if (error) throwSupabaseError('friends.api getReceivedEventInvites', error);
  return (data ?? []) as ReceivedEventInvite[];
};

/**
 * Returns the PENDING event invite for the current user on a specific event, or null if none.
 */
export const getUserEventInvite = async (
  eventId: string,
  userId: string,
): Promise<EventInvite | null> => {
  const { data, error } = await supabase
    .from('event_invites')
    .select('*')
    .eq('event_id', eventId)
    .eq('invited_user_id', userId)
    .eq('status', 'PENDING')
    .maybeSingle();
  if (error) throwSupabaseError('friends.api getUserEventInvite', error);
  return data as EventInvite | null;
};

/**
 * Accept or decline an event invite. Status must be ACCEPTED or DECLINED.
 */
export const respondToEventInvite = async (
  inviteId: string,
  status: EventInviteStatus,
): Promise<void> => {
  const { error } = await supabase
    .from('event_invites')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', inviteId);
  if (error) throwSupabaseError('friends.api respondToEventInvite', error);
};
