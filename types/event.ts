export enum EventVisibility {
  PUBLIC = "PUBLIC",
  SOCIETY_ONLY = "SOCIETY_ONLY",
  UNIVERSITY_ONLY = "UNIVERSITY_ONLY",
  PRIVATE = "PRIVATE",
}

export enum EventJoinPolicy {
  OPEN = "OPEN",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  INVITE_ONLY = "INVITE_ONLY",
}

export enum EventHostType {
  USER = "USER",
  SOCIETY = "SOCIETY",
  UNIVERSITY = "UNIVERSITY",
}

export enum EventBookingMode {
  FREE = "FREE",
  TICKETED = "TICKETED",
}

export enum EventOrganizerRole {
  HOST = "HOST",
  CO_HOST = "CO_HOST",
  PARTNER = "PARTNER",
}

export enum EventParticipantStatus {
  REQUESTED = "REQUESTED",   // waiting approval
  GOING = "GOING",           // confirmed
  REJECTED = "REJECTED",
  LEFT = "LEFT",
  WAITLISTED = "WAITLISTED",
  INVITED = "INVITED",       // for invite-only events
}

export enum EventImageType {
  BANNER = "BANNER",
  GALLERY = "GALLERY",
}

export enum EventInviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

/**
 * Supabase table: events
 * Core event record — can be hosted by a user, society, or university.
 * FK: created_by_user_id → profiles.id, society_id → societies.id, university_id → universities.id.
 * Referenced by: event_participants, event_societies, event_univetsities,
 * event_images, event_tickets, event_invites.
 * Note: the updated-at column is named `update_at` in the DB (typo in the schema).
 */
export interface Event {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  is_online: boolean
  address: string | null
  latitude: number | null
  longitude: number | null
  geohash: string | null
  visibility: EventVisibility
  join_policy: EventJoinPolicy | null
  max_participants: number | null
  is_cancelled: boolean
  created_by_user_id: string
  host_type: EventHostType
  society_id: string | null
  university_id: string | null
  banner_image_url: string | null
  booking_mode: EventBookingMode | null
  price_from: number | null
  currency: string | null
  created_at: string
  update_at: string
}

/**
 * Supabase table: event_societies
 * Relationship between an event and a society that is co-hosting or partnering.
 * PK: (event_id, society_id).
 * FK: event_id → events.id, society_id → societies.id.
 */
export interface EventSociety {
  event_id: string
  society_id: string
  role: EventOrganizerRole
}

/**
 * Supabase table: event_univetsities (note: typo in DB table name)
 * Relationship between an event and a university that is co-hosting or partnering.
 * PK: (event_id, university_id).
 * FK: event_id → events.id, university_id → universities.id.
 */
export interface EventUniversity {
  event_id: string
  university_id: string
  role: EventOrganizerRole | null
}

/**
 * Supabase table: event_participants
 * Tracks which users are attending an event and their current RSVP status.
 * PK: (event_id, user_id).
 * FK: event_id → events.id, user_id → profiles.id.
 */
export interface EventParticipant {
  event_id: string
  user_id: string
  status: EventParticipantStatus
  joined_at: string
}

/**
 * Supabase table: event_images
 * Banner and gallery images attached to an event.
 * FK: event_id → events.id.
 */
export interface EventImage {
  id: string
  event_id: string
  image_url: string
  image_type: EventImageType
  sort_order: number
  created_at: string
}

/**
 * Supabase table: event_tickets
 * Ticket tiers available for purchase on a ticketed event.
 * FK: event_id → events.id.
 * Note: `id` is a bigint identity column (number, not string).
 * Note: the updated-at column is named `update_at` in the DB (typo in the schema).
 */
export interface EventTicket {
  id: number
  event_id: string
  name: string
  description: string | null
  price: number
  currency: string
  max_quantity: number | null
  sales_start_date: string | null
  sales_end_date: string | null
  is_active: boolean | null
  created_at: string
  update_at: string | null
}

/**
 * Supabase table: event_invites
 * Records direct invitations sent from one user to another for a specific event.
 * FK: event_id → events.id, invited_user_id → profiles.id, invited_by_user_id → profiles.id.
 */
export interface EventInvite {
  id: string
  event_id: string
  invited_user_id: string
  invited_by_user_id: string
  status: EventInviteStatus
  created_at: string
  updated_at: string | null
}

/**
 * Not a Supabase table — query result type.
 * EventInvite row joined with minimal event and inviter profile data.
 * Returned by getReceivedEventInvites().
 */
export interface ReceivedEventInvite extends EventInvite {
  event: Pick<Event, 'id' | 'name' | 'start_date' | 'end_date' | 'address'>;
  invited_by: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  };
}

/** Form type — not a Supabase table. Used when creating a new event. */
export interface CreateEventForm {
  name: string
  description: string | null
  start_date: string
  end_date: string
  is_online: boolean
  address: string | null
  latitude: number | null
  longitude: number | null
  visibility: EventVisibility
  join_policy: EventJoinPolicy
  max_participants: number | null
  host_type: EventHostType
  society_id: string | null
  university_id: string | null
  banner_image_url: string | null
  banner_image_uri: string | null
  gallery_image_uris: string[]
  booking_mode: EventBookingMode
  price_from: number | null
  currency: string | null
}
