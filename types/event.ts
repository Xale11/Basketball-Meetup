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
  GOING = "GOING",
  PENDING = "PENDING",
  WAITLISTED = "WAITLISTED",
  CANCELLED = "CANCELLED",
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

export interface EventSociety {
  event_id: string
  society_id: string
  role: EventOrganizerRole
}

export interface EventUniversity {
  event_id: string
  university_id: string
  role: EventOrganizerRole | null
}

export interface EventParticipant {
  event_id: string
  user_id: string
  status: EventParticipantStatus
  joined_at: string
}

export interface EventImage {
  id: string
  event_id: string
  image_url: string
  image_type: EventImageType
  sort_order: number
  created_at: string
}

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

export interface EventInvite {
  id: string
  event_id: string
  invited_user_id: string
  invited_by_user_id: string
  status: EventInviteStatus
  created_at: string
  updated_at: string | null
}

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