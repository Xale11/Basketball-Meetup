import { Event, CreateEventForm, EventImageType } from '@/types/event'
import { SocietyRoleIdEnum } from '@/types/societies'
import { UniversityRole } from '@/types/universities'
import { supabase } from './supabase'
import { uploadToSupabaseBucket } from './supabase-storage.api'

const EVENT_IMAGES_BUCKET = 'event_images'

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

    if (error) throw new Error(JSON.stringify(error))

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
      await supabase
        .from('events')
        .update({ banner_image_url: bannerUrl })
        .eq('id', event.id)
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
      await supabase.from('event_images').insert(galleryRows)
    }

    return event
  } catch (error: any) {
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

    if (error) throw new Error(JSON.stringify(error))

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

    // Upload new banner if one was selected, otherwise keep existing
    if (form.banner_image_uri) {
      const bannerUrl = await uploadToSupabaseBucket(
        form.banner_image_uri,
        folder,
        'cover',
        EVENT_IMAGES_BUCKET,
      )
      await supabase
        .from('events')
        .update({ banner_image_url: bannerUrl })
        .eq('id', eventId)
      event.banner_image_url = bannerUrl
    } else if (form.banner_image_url === null) {
      // User explicitly removed the banner
      await supabase
        .from('events')
        .update({ banner_image_url: null })
        .eq('id', eventId)
      event.banner_image_url = null
    }

    return event
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_cancelled', false)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (error) throw new Error(JSON.stringify(error))

    return (data ?? []) as Event[]
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const fetchEventsByUserId = async (userId: string): Promise<Event[]> => {
  try {
    if (!userId) throw new Error('No userId provided to fetchEventsByUserId')

    // Events the user created directly
    const { data: createdEvents, error: createdError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('start_date', { ascending: true })
    if (createdError) throw new Error(JSON.stringify(createdError))

    // Society IDs where the user has EXEC, PRESIDENT, or OWNER role
    const { data: societyMemberships, error: smError } = await supabase
      .from('society_memberships')
      .select('society_id')
      .eq('user_id', userId)
      .in('role_id', [SocietyRoleIdEnum.EXEC, SocietyRoleIdEnum.PRESIDENT, SocietyRoleIdEnum.OWNER])
    if (smError) throw new Error(JSON.stringify(smError))

    const societyIds = (societyMemberships ?? []).map((m) => m.society_id)

    let societyEvents: Event[] = []
    if (societyIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'SOCIETY')
        .in('society_id', societyIds)
        .order('start_date', { ascending: true })
      if (error) throw new Error(JSON.stringify(error))
      societyEvents = (data ?? []) as Event[]
    }

    // University IDs where the user has ADMIN role
    const { data: uniMemberships, error: umError } = await supabase
      .from('university_memberships')
      .select('university_id')
      .eq('user_id', userId)
      .eq('role', UniversityRole.ADMIN)
    if (umError) throw new Error(JSON.stringify(umError))

    const universityIds = (uniMemberships ?? []).map((m) => m.university_id)

    let universityEvents: Event[] = []
    if (universityIds.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_type', 'UNIVERSITY')
        .in('university_id', universityIds)
        .order('start_date', { ascending: true })
      if (error) throw new Error(JSON.stringify(error))
      universityEvents = (data ?? []) as Event[]
    }

    // Merge and deduplicate by event ID
    const all = [...(createdEvents ?? []), ...societyEvents, ...universityEvents]
    const seen = new Set<string>()
    return all.filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    }) as Event[]
  } catch (error: any) {
    throw new Error(error.message)
  }
}
