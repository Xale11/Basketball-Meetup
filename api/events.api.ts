import { Event, CreateEventForm } from '@/types/event'
import { supabase } from './supabase'

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
        banner_image_url: form.banner_image_url,
        booking_mode: form.booking_mode,
        price_from: form.price_from,
        currency: form.currency,
        created_by_user_id: userId,
        is_cancelled: false,
      })
      .select('*')
      .maybeSingle()

    if (error) throw new Error(JSON.stringify(error))

    return data as Event
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

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('start_date', { ascending: true })

    if (error) throw new Error(JSON.stringify(error))

    return (data ?? []) as Event[]
  } catch (error: any) {
    throw new Error(error.message)
  }
}
