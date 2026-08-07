/**
 * Basketball Meetup (BM_) app only.
 * `Court` maps to the Supabase table `public.courts` — note the DB stores
 * location flattened (address/latitude/longitude/geohash columns) and
 * `opening_hours` as jsonb; api/courts.api.ts maps between the two shapes.
 * `CourtVisit` and `Review` are not yet tables.
 */

/** Not a Supabase table — BM_ only. A single visit/check-in record for a court. */
export interface CourtVisit {
  court_id: string;
  date: string; // ISO string
  checked_in: boolean;
}

/** Supabase table: courts (shape is nested here, flat in the DB). BM_ only. */
export interface Court {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    geohash: string;
  };
  images?: string[];
  tags: string[]; // amenities - extensive list of options
  checked_in_users: string[];
  followers: string[];
  created_by: string;
  created_at: string;
  rating?: number;
  reviews?: Review[];
  opening_hours: OpeningHours;
  verified: boolean;
}

/** Not a Supabase table — BM_ only. Opening hours configuration for a court. */
export interface OpeningHours {
  always_open: boolean;
  monday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  tuesday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  wednesday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  thursday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  friday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  saturday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
  sunday: {
    always_open: boolean;
    open_time: string;
    close_time: string;
  };
}

/** Not a Supabase table — BM_ only. A user review attached to a court. */
export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

/** Form type — not a Supabase table. Used when submitting a new court for listing (BM_ only). */
export interface CreateCourtForm {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  images: string[]; // Array of local image URIs
  tags: string[]; // amenities - extensive list of options
  opening_hours: OpeningHours;
  // No `created_by`: ownership is taken from the session in useCreateCourt and
  // enforced by the courts RLS insert policy (auth.uid() = created_by).
}
