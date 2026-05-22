export enum SocietyStatusEnum {
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum SocietyRoleIdEnum {
  OWNER = "OWNER",
  PRESIDENT = "PRESIDENT",
  EXEC = "EXEC",
  MODERATOR = "MODERATOR",
  MEMBER = "MEMBER",
}

export enum SocietyMembershipStatusEnum {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  BANNED = "BANNED",
}

/**
 * Supabase table: society_roles
 * Lookup table of available roles within a society (e.g. OWNER, MEMBER).
 * Referenced by: society_memberships.role_id.
 */
export interface SocietyRole {
  id: string
  name: string | null
}

export const SOCIETY_CATEGORIES = ['Sport', 'Social', 'Academic', 'Arts', 'Tech', 'Other'] as const;
export type SocietyCategory = typeof SOCIETY_CATEGORIES[number];

export const ADMIN_SOCIETY_ROLES = [
  SocietyRoleIdEnum.OWNER,
  SocietyRoleIdEnum.PRESIDENT,
  SocietyRoleIdEnum.EXEC,
] as const;

/**
 * Supabase table: societies
 * Represents a student society or club, optionally tied to a university.
 * FK: university_id → universities.id, created_by_user_id → auth.users.id.
 * Referenced by: society_memberships.society_id, events.society_id, event_societies.society_id.
 */
export interface Society {
  id: string;
  university_id: string | null;
  name: string | null;
  description: string | null;
  logo: string | null;
  category: string | null;
  created_by_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
}

/**
 * Supabase table: society_memberships
 * Junction table linking a profile to a society with a role and membership status.
 * PK: (user_id, society_id).
 * FK: user_id → profiles.id, society_id → societies.id, role_id → society_roles.id.
 */
export interface SocietyMembership {
  society_id: string;
  user_id: string;
  role_id: SocietyRoleIdEnum | null;
  status: SocietyMembershipStatusEnum | null;
  joined_at: string;
  updated_at: string | null;
}
