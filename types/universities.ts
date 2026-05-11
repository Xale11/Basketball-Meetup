export enum UniversityRole {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

/**
 * Supabase table: universities
 * Lookup table of all universities on the platform.
 * Referenced by: societies.university_id, events.university_id,
 * university_memberships.university_id, event_univetsities.university_id.
 */
export interface University {
  id: string
  name: string | null
  status: string
}

/**
 * Supabase table: university_memberships
 * Junction table linking a profile to a university with a role (e.g. STUDENT, STAFF).
 * PK: (user_id, university_id).
 * FK: user_id → profiles.id, university_id → universities.id.
 */
export interface UniversityMembership {
  user_id: string
  university_id: string
  role: UniversityRole
  created_at: string
  updated_at: string
}
