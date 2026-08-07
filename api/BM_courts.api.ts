import { Court, CreateCourtForm, OpeningHours } from '@/types/courts';
import { supabase } from './supabase';
import { uploadToSupabaseBucket } from './supabase-storage.api';

const COURT_IMAGES_BUCKET = 'court_images';

/** Shape of a row in public.courts. Location is flattened in the DB. */
type CourtRow = {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  images: string[];
  tags: string[];
  checked_in_users: string[];
  followers: string[];
  opening_hours: OpeningHours;
  created_by: string;
  rating: number | null;
  verified: boolean;
  created_at: string;
};

/** Maps a flat DB row onto the nested `Court` shape the UI expects. */
const toCourt = (row: CourtRow): Court => ({
  id: row.id,
  name: row.name,
  description: row.description,
  location: {
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    geohash: row.geohash,
  },
  images: row.images,
  tags: row.tags,
  checked_in_users: row.checked_in_users,
  followers: row.followers,
  created_by: row.created_by,
  created_at: row.created_at,
  rating: row.rating ?? undefined,
  opening_hours: row.opening_hours,
  verified: row.verified,
});

function logSupabaseError(context: string, error: any) {
  console.error(`[courts.api] ${context} — Supabase error:`, {
    message: error?.message,
    code: error?.code, // '42501' = RLS violation
    details: error?.details,
    hint: error?.hint,
  });
}

/**
 * Creates a court owned by `userId`.
 *
 * The row is inserted first so the images can be filed under the real court id;
 * the upload path is `<user_id>/<court_id>/<n>.<ext>`, which is what the storage
 * policy checks against auth.uid().
 */
export const createCourt = async (court: CreateCourtForm, userId: string): Promise<Court> => {
  const { data, error } = await supabase
    .from('courts')
    .insert({
      name: court.name,
      description: court.description,
      address: court.address,
      latitude: court.latitude,
      longitude: court.longitude,
      geohash: court.geohash,
      tags: court.tags,
      opening_hours: court.opening_hours,
      created_by: userId,
      images: [],
    })
    .select('*')
    .maybeSingle();

  if (error) {
    logSupabaseError('createCourt insert', error);
    throw new Error(error.message);
  }

  const row = data as CourtRow;

  if (!court.images?.length) return toCourt(row);

  // Upload images, then attach them. A failed upload must not leave a court
  // with half a gallery, so the whole batch resolves before the update.
  try {
    const imageUrls = await Promise.all(
      court.images.map((uri, index) =>
        uploadToSupabaseBucket(uri, `${userId}/${row.id}`, `${index + 1}`, COURT_IMAGES_BUCKET),
      ),
    );

    const { data: updated, error: updateError } = await supabase
      .from('courts')
      .update({ images: imageUrls })
      .eq('id', row.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      logSupabaseError('createCourt image update', updateError);
      throw new Error(updateError.message);
    }

    return toCourt(updated as CourtRow);
  } catch (uploadError: any) {
    // Roll the court back rather than leaving an imageless orphan behind.
    await supabase.from('courts').delete().eq('id', row.id);
    console.error('[courts.api] createCourt images failed, court rolled back');
    throw new Error(uploadError?.message ?? 'Failed to upload court images');
  }
};

export const fetchCourts = async (): Promise<Court[]> => {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchCourts', error);
    throw new Error(error.message);
  }

  return ((data ?? []) as CourtRow[]).map(toCourt);
};

export const fetchCourtById = async (id: string): Promise<Court | null> => {
  const { data, error } = await supabase.from('courts').select('*').eq('id', id).maybeSingle();

  if (error) {
    logSupabaseError('fetchCourtById', error);
    throw new Error(error.message);
  }

  return data ? toCourt(data as CourtRow) : null;
};
