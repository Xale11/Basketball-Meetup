import { Event, CreateEventForm, EventImageType, EventParticipant, EventParticipantStatus, EventJoinPolicy, EventWithCounts } from '@/types/event'
import { SocietyRoleIdEnum } from '@/types/societies'
import { UniversityRole } from '@/types/universities'
import { supabase } from './supabase'
import { uploadToSupabaseBucket } from './supabase-storage.api'
import { throwSupabaseError } from '@/lib/supabaseError'
import { FriendProfile } from '@/types/friends'

const EVENT_IMAGES_BUCKET = 'event_images'

// Non-fatal Supabase failures — e.g. a banner update that happens after the
// event row is already written, where aborting would be worse than continuing —
// log and carry on. Fatal ones use throwSupabaseError, which logs and throws a
// typed SupabaseApiError carrying the Postgres code.
function logSupabaseError(context: string, error: any) {
  console.error(`[events.api ${context}] Supabase error:`, {
    message: error?.message,
    code: error?.code,        // e.g. '42501' = RLS violation, '23505' = unique constraint
    details: error?.details,
    hint: error?.hint,
  })
}

export const createEvent = async (
  form: CreateEventForm,
  userId: string,
): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        is_online: form.is_online,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        visibility: form.visibility,
        join_policy: form.join_policy,
        max_participants: form.max_participants,
        host_type: form.host_type,
        society_id: form.society_id,
        university_id: form.university_id,
        banner_image_url: null,
        booking_mode: form.booking_mode,
        price_from: form.price_from,
        currency: form.currency,
        created_by_user_id: userId,
        is_cancelled: false,
      })
      .select('*')
      .maybeSingle()

    if (error) {
      throwSupabaseError('events.api createEvent insert', error)
    }

    const event = data as Event

    // Build folder path based on host_type
    let folder: string
    if (form.host_type === 'UNIVERSITY') {
      folder = `UNIVERSITY/${form.university_id}/${event.id}`
    } else if (form.host_type === 'SOCIETY') {
      folder = `SOCIETY/${form.society_id}/${event.id}`
    } else {
      folder = `USER/${userId}/${event.id}`
    }

    // Upload banner
    if (form.banner_image_uri) {
      const bannerUrl = await uploadToSupabaseBucket(
        form.banner_image_uri,
        folder,
        'cover',
        EVENT_IMAGES_BUCKET,
      )
      const { error: bannerError } = await supabase
        .from('events')
        .update({ banner_image_url: bannerUrl })
        .eq('id', event.id)
      if (bannerError) logSupabaseError('createEvent banner update', bannerError)
      event.banner_image_url = bannerUrl
    }

    // Upload gallery images
    if (form.gallery_image_uris.length > 0) {
      const galleryRows = await Promise.all(
        form.gallery_image_uris.map(async (uri, index) => {
          const url = await uploadToSupabaseBucket(
            uri,
            `${folder}/gallery`,
            `${index + 1}`,
            EVENT_IMAGES_BUCKET,
          )
          return {
            event_id: event.id,
            image_url: url,
            image_type: EventImageType.GALLERY,
            sort_order: index,
          }
        })
      )
      const { error: galleryError } = await supabase.from('event_images').insert(galleryRows)
      if (galleryError) logSupabaseError('createEvent gallery insert', galleryError)
    }

    return event
  } catch (error: any) {
    console.error('[createEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const updateEvent = async (
  eventId: string,
  form: CreateEventForm,
  userId: string,
): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        name: form.name,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        is_online: form.is_online,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        visibility: form.visibility,
        join_policy: form.join_policy,
        max_participants: form.max_participants,
        host_type: form.host_type,
        society_id: form.society_id,
        university_id: form.university_id,
        booking_mode: form.booking_mode,
        price_from: form.price_from,
        currency: form.currency,
      })
      .eq('id', eventId)
      .select('*')
      .maybeSingle()

    if (error) {
      throwSupabaseError('events.api updateEvent update', error)
    }

    const event = data as Event

    // Build folder path based on host_type
    let folder: string
    if (form.host_type === 'UNIVERSITY') {
      folder = `UNIVERSITY/${form.university_id}/${eventId}`
    } else if (form.host_type === 'SOCIETY') {
      folder = `SOCIETY/${form.society_id}/${eventId}`
    } else {
      folder = `USER/${userId}/${eventId}`
    }

    if (form.banner_image_uri) {
      const bannerUrl = await uploadToSupabaseBucket(
        form.banner_image_uri,
        folder,
        'cover',
        EVENT_IMAGES_BUCKET,
      )
      const { error: bannerError } = await supabase
        .from('events')
        .update({ banner_image_url: bannerUrl })
        .eq('id', eventId)
      if (bannerError) logSupabaseError('updateEvent banner update', bannerError)
      event.banner_image_url = bannerUrl
    } else if (form.banner_image_url === null) {
      const { error: bannerError } = await supabase
        .from('events')
        .update({ banner_image_url: null })
        .eq('id', eventId)
      if (bannerError) logSupabaseError('updateEvent banner removal', bannerError)
      event.banner_image_url = null
    }

    return event
  } catch (error: any) {
    console.error('[updateEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchEvents = async (
  universityId?: string | null,
  societyIds?: string[],
): Promise<EventWithCounts[]> => {
  try {
    const now = new Date().toISOString()

    const visibilityFilter = ['PUBLIC']
    if (universityId) visibilityFilter.push('UNIVERSITY_ONLY')
    if (societyIds && societyIds.length > 0) visibilityFilter.push('SOCIETY_ONLY')

    // `event_participants(count)` is a PostgREST aggregate — one query for every
    // event's confirmed headcount, rather than a request per card. The
    // `status` filter applies to the embedded rows, so it narrows the count
    // without dropping events that nobody has joined.
    const { data, error } = await supabase
      .from('events')
      .select('*, event_participants(count)')
      .eq('event_participants.status', EventParticipantStatus.GOING)
      .eq('is_cancelled', false)
      .gte('end_date', now)
      .in('visibility', visibilityFilter)
      .order('start_date', { ascending: true })

    if (error) {
      throwSupabaseError('events.api fetchEvents select', error)
    }

    const memberSocietySet = new Set(societyIds ?? [])
    type Row = Event & { event_participants?: { count: number }[] }

    return ((data ?? []) as Row[])
      .filter((e) => {
        if (e.visibility === 'UNIVERSITY_ONLY') return e.university_id === universityId
        if (e.visibility === 'SOCIETY_ONLY')
          return e.society_id != null && memberSocietySet.has(e.society_id)
        return true
      })
      .map(({ event_participants, ...event }) => ({
        ...(event as Event),
        // An event with no participants embeds an empty array, not a zero row.
        going_count: event_participants?.[0]?.count ?? 0,
      }))
  } catch (error: any) {
    console.error('[fetchEvents] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchEventsByUserId = async (userId: string): Promise<Event[]> => {
  try {
    if (!userId) throw new Error('No userId provided to fetchEventsByUserId')

    const { data: createdEvents, error: createdError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('start_date', { ascending: true })
    if (createdError) {
      throwSupabaseError('events.api fetchEventsByUserId createdEvents', createdError)
    }

    const { data: societyMemberships, error: smError } = await supabase
      .from('society_memberships')
      .select('society_id')
      .eq('user_id', userId)
      .in('role_id', [SocietyRoleIdEnum.EXEC, SocietyRoleIdEnum.PRESIDENT, SocietyRoleIdEnum.OWNER])
    if (smError) {
      throwSupabaseError('events.api fetchEventsByUserId societyMemberships', smError)
    }

    const societyIds = (societyMemberships ?? []).map((m) => m.society_id)

    let societyEvents: Event[] = []
    if (societyIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'SOCIETY')
        .in('society_id', societyIds)
        .order('start_date', { ascending: true })
      if (error) {
        throwSupabaseError('events.api fetchEventsByUserId societyEvents', error)
      }
      societyEvents = (data ?? []) as Event[]
    }

    const { data: uniMemberships, error: umError } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', userId)
      .eq('role', UniversityRole.ADMIN)
    if (umError) {
      throwSupabaseError('events.api fetchEventsByUserId uniMemberships', umError)
    }

    const universityIds = (uniMemberships ?? []).map((m) => m.university_id)

    let universityEvents: Event[] = []
    if (universityIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'UNIVERSITY')
        .in('university_id', universityIds)
        .order('start_date', { ascending: true })
      if (error) {
        throwSupabaseError('events.api fetchEventsByUserId universityEvents', error)
      }
      universityEvents = (data ?? []) as Event[]
    }

    const all = [...(createdEvents ?? []), ...societyEvents, ...universityEvents]
    const seen = new Set<string>()
    const deduped = all.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    }) as Event[]

    return deduped
  } catch (error: any) {
    console.error('[fetchEventsByUserId] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchEventById = async (eventId: string): Promise<{ event: Event; participantCount: number }> => {
  try {
    const [{ data: eventData, error: eventError }, { count, error: countError }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    ])
    if (eventError) {
      throwSupabaseError('events.api fetchEventById event select', eventError)
    }
    if (countError) {
      throwSupabaseError('events.api fetchEventById participant count', countError)
    }
    return { event: eventData as Event, participantCount: count ?? 0 }
  } catch (error: any) {
    console.error('[fetchEventById] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const joinEvent = async (
  eventId: string,
  userId: string,
  joinPolicy: EventJoinPolicy | null,
): Promise<EventParticipant> => {
  try {
    const status = joinPolicy === EventJoinPolicy.APPROVAL_REQUIRED
      ? EventParticipantStatus.REQUESTED
      : EventParticipantStatus.GOING
    const { data, error } = await supabase
      .from('event_participants')
      .insert({ event_id: eventId, user_id: userId, status })
      .select('*')
      .single()
    if (error) {
      throwSupabaseError('events.api joinEvent insert', error)
    }
    return data as EventParticipant
  } catch (error: any) {
    console.error('[joinEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const leaveEvent = async (eventId: string, userId: string): Promise<void> => {
  try {
    const { error, data } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    if (error) {
      throwSupabaseError('events.api leaveEvent delete', error)
    }
  } catch (error: any) {
    console.error('[leaveEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchUserParticipatingEventIds = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
    if (error) {
      throwSupabaseError('events.api fetchUserParticipatingEventIds select', error)
    }
    const ids = (data ?? []).map((p: { event_id: string }) => p.event_id)
    return ids
  } catch (error: any) {
    console.error('[fetchUserParticipatingEventIds] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchUserParticipations = async (userId: string): Promise<EventParticipant[]> => {
  try {
    if (!userId) throw new Error('No userId provided')
    const { data, error } = await supabase
      .from('event_participants')
      .select('event_id, user_id, status, joined_at')
      .eq('user_id', userId)
    if (error) throwSupabaseError('events.api fetchUserParticipations', error)
    return (data ?? []) as EventParticipant[]
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const fetchEventsBySocietyId = async (societyId: string): Promise<Event[]> => {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('society_id', societyId)
      .eq('is_cancelled', false)
      .gte('end_date', now)
      .order('start_date', { ascending: true })
    if (error) {
      throwSupabaseError('events.api fetchEventsBySocietyId select', error)
    }
    return (data ?? []) as Event[]
  } catch (error: any) {
    console.error('[fetchEventsBySocietyId] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchParticipantEvents = async (userId: string): Promise<Event[]> => {
  try {
    if (!userId) throw new Error('No userId provided to fetchParticipantEvents')

    const { data: participations, error: pError } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
    if (pError) {
      throwSupabaseError('events.api fetchParticipantEvents participations select', pError)
    }

    const eventIds = (participations ?? []).map((p: { event_id: string }) => p.event_id)
    if (eventIds.length === 0) return []

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_date', { ascending: true })
    if (error) {
      throwSupabaseError('events.api fetchParticipantEvents events select', error)
    }

    return (data ?? []) as Event[]
  } catch (error: any) {
    console.error('[fetchParticipantEvents] caught error:', error.message)
    throw new Error(error.message)
  }
}

/**
 * Everyone confirmed GOING to an event, with their profile — drives the
 * attendees list on the detail screen. One query, not one per attendee.
 */
export const fetchEventAttendees = async (eventId: string): Promise<FriendProfile[]> => {
  const { data, error } = await supabase
    .from('event_participants')
    .select(
      'profiles!event_participants_user_id_fkey(id, first_name, last_name, photo_url, university_id, course)',
    )
    .eq('event_id', eventId)
    .eq('status', EventParticipantStatus.GOING)

  if (error) throwSupabaseError('events.api fetchEventAttendees', error)

  return ((data ?? []) as any[]).map((r) => r.profiles).filter(Boolean) as FriendProfile[]
}
