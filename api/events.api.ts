import { Event, CreateEventForm, EventImageType, EventParticipant, EventParticipantStatus, EventJoinPolicy } from '@/types/event'
import { SocietyRoleIdEnum } from '@/types/societies'
import { UniversityRole } from '@/types/universities'
import { supabase } from './supabase'
import { uploadToSupabaseBucket } from './supabase-storage.api'

const EVENT_IMAGES_BUCKET = 'event_images'

// Logs a Supabase error with all fields that matter for debugging (code, hint, details
// are dropped by JSON.stringify on some error shapes, so we pull them explicitly).
function logSupabaseError(context: string, error: any) {
  console.error(`[events.api] ${context} — Supabase error:`, {
    message: error?.message,
    code: error?.code,        // e.g. '42501' = RLS violation, '23505' = unique constraint
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    raw: error,
  })
}

export const createEvent = async (
  form: CreateEventForm,
  userId: string,
): Promise<Event> => {
  console.log('[createEvent] start — userId:', userId, '| host_type:', form.host_type)
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
      logSupabaseError('createEvent insert', error)
      throw new Error(error.message)
    }

    const event = data as Event
    console.log('[createEvent] insert successful — eventId:', event.id)

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
      console.log('[createEvent] uploading banner — folder:', folder)
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
      console.log('[createEvent] uploading', form.gallery_image_uris.length, 'gallery images')
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
  console.log('[updateEvent] start — eventId:', eventId, '| userId:', userId)
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
      logSupabaseError('updateEvent update', error)
      throw new Error(error.message)
    }

    const event = data as Event
    console.log('[updateEvent] update successful — eventId:', event.id)

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
      console.log('[updateEvent] uploading new banner — folder:', folder)
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
      console.log('[updateEvent] removing banner — eventId:', eventId)
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
): Promise<Event[]> => {
  console.log('[fetchEvents] start — universityId:', universityId, '| societyIds:', societyIds?.length ?? 0)
  try {
    const now = new Date().toISOString()

    const visibilityFilter = ['PUBLIC']
    if (universityId) visibilityFilter.push('UNIVERSITY_ONLY')
    if (societyIds && societyIds.length > 0) visibilityFilter.push('SOCIETY_ONLY')

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_cancelled', false)
      .gte('end_date', now)
      .in('visibility', visibilityFilter)
      .order('start_date', { ascending: true })

    if (error) {
      logSupabaseError('fetchEvents select', error)
      throw new Error(error.message)
    }

    const memberSocietySet = new Set(societyIds ?? [])
    const filtered = (data ?? []).filter((e: Event) => {
      if (e.visibility === 'UNIVERSITY_ONLY') return e.university_id === universityId
      if (e.visibility === 'SOCIETY_ONLY') return e.society_id != null && memberSocietySet.has(e.society_id)
      return true
    }) as Event[]

    console.log('[fetchEvents] returned', filtered.length, 'events')
    return filtered
  } catch (error: any) {
    console.error('[fetchEvents] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchEventsByUserId = async (userId: string): Promise<Event[]> => {
  console.log('[fetchEventsByUserId] start — userId:', userId)
  try {
    if (!userId) throw new Error('No userId provided to fetchEventsByUserId')

    const { data: createdEvents, error: createdError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('start_date', { ascending: true })
    if (createdError) {
      logSupabaseError('fetchEventsByUserId createdEvents', createdError)
      throw new Error(createdError.message)
    }
    console.log('[fetchEventsByUserId] createdEvents:', createdEvents?.length ?? 0)

    const { data: societyMemberships, error: smError } = await supabase
      .from('society_memberships')
      .select('society_id')
      .eq('user_id', userId)
      .in('role_id', [SocietyRoleIdEnum.EXEC, SocietyRoleIdEnum.PRESIDENT, SocietyRoleIdEnum.OWNER])
    if (smError) {
      logSupabaseError('fetchEventsByUserId societyMemberships', smError)
      throw new Error(smError.message)
    }

    const societyIds = (societyMemberships ?? []).map((m) => m.society_id)
    console.log('[fetchEventsByUserId] privileged societyIds:', societyIds.length)

    let societyEvents: Event[] = []
    if (societyIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'SOCIETY')
        .in('society_id', societyIds)
        .order('start_date', { ascending: true })
      if (error) {
        logSupabaseError('fetchEventsByUserId societyEvents', error)
        throw new Error(error.message)
      }
      societyEvents = (data ?? []) as Event[]
      console.log('[fetchEventsByUserId] societyEvents:', societyEvents.length)
    }

    const { data: uniMemberships, error: umError } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', userId)
      .eq('role', UniversityRole.ADMIN)
    if (umError) {
      logSupabaseError('fetchEventsByUserId uniMemberships', umError)
      throw new Error(umError.message)
    }

    const universityIds = (uniMemberships ?? []).map((m) => m.university_id)
    console.log('[fetchEventsByUserId] admin universityIds:', universityIds.length)

    let universityEvents: Event[] = []
    if (universityIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'UNIVERSITY')
        .in('university_id', universityIds)
        .order('start_date', { ascending: true })
      if (error) {
        logSupabaseError('fetchEventsByUserId universityEvents', error)
        throw new Error(error.message)
      }
      universityEvents = (data ?? []) as Event[]
      console.log('[fetchEventsByUserId] universityEvents:', universityEvents.length)
    }

    const all = [...(createdEvents ?? []), ...societyEvents, ...universityEvents]
    const seen = new Set<string>()
    const deduped = all.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    }) as Event[]

    console.log('[fetchEventsByUserId] total after dedup:', deduped.length)
    return deduped
  } catch (error: any) {
    console.error('[fetchEventsByUserId] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchEventById = async (eventId: string): Promise<{ event: Event; participantCount: number }> => {
  console.log('[fetchEventById] start — eventId:', eventId)
  try {
    const [{ data: eventData, error: eventError }, { count, error: countError }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('event_id', eventId),
    ])
    if (eventError) {
      logSupabaseError('fetchEventById event select', eventError)
      throw new Error(eventError.message)
    }
    if (countError) {
      logSupabaseError('fetchEventById participant count', countError)
      throw new Error(countError.message)
    }
    console.log('[fetchEventById] success — participantCount:', count)
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
  console.log('[joinEvent] start — eventId:', eventId, '| userId:', userId, '| joinPolicy:', joinPolicy)
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
      logSupabaseError('joinEvent insert', error)
      throw new Error(error.message)
    }
    console.log('[joinEvent] insert successful — status:', status)
    return data as EventParticipant
  } catch (error: any) {
    console.error('[joinEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const leaveEvent = async (eventId: string, userId: string): Promise<void> => {
  console.log('[leaveEvent] start — eventId:', eventId, '| userId:', userId)
  try {
    const { error, data } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    console.log('[leaveEvent] delete result:', { data, error })
    if (error) {
      logSupabaseError('leaveEvent delete', error)
      throw new Error(error.message)
    }
  } catch (error: any) {
    console.error('[leaveEvent] caught error:', error.message)
    throw new Error(error.message)
  }
}

export const fetchUserParticipatingEventIds = async (userId: string): Promise<string[]> => {
  console.log('[fetchUserParticipatingEventIds] start — userId:', userId)
  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
    if (error) {
      logSupabaseError('fetchUserParticipatingEventIds select', error)
      throw new Error(error.message)
    }
    const ids = (data ?? []).map((p: { event_id: string }) => p.event_id)
    console.log('[fetchUserParticipatingEventIds] found', ids.length, 'participations')
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
    if (error) throw new Error(JSON.stringify(error))
    return (data ?? []) as EventParticipant[]
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const fetchParticipantEvents = async (userId: string): Promise<Event[]> => {
  console.log('[fetchParticipantEvents] start — userId:', userId)
  try {
    if (!userId) throw new Error('No userId provided to fetchParticipantEvents')

    const { data: participations, error: pError } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('user_id', userId)
    if (pError) {
      logSupabaseError('fetchParticipantEvents participations select', pError)
      throw new Error(pError.message)
    }

    const eventIds = (participations ?? []).map((p: { event_id: string }) => p.event_id)
    console.log('[fetchParticipantEvents] found', eventIds.length, 'participation records')
    if (eventIds.length === 0) return []

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('start_date', { ascending: true })
    if (error) {
      logSupabaseError('fetchParticipantEvents events select', error)
      throw new Error(error.message)
    }

    console.log('[fetchParticipantEvents] returned', data?.length ?? 0, 'events')
    return (data ?? []) as Event[]
  } catch (error: any) {
    console.error('[fetchParticipantEvents] caught error:', error.message)
    throw new Error(error.message)
  }
}
