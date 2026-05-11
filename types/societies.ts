export enum SocietyStatusEnum {
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED"
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


export interface SocietyRole {
  id: string
  name: string | null
}

export interface Society {
  id: string;
  university_id: string | null;
  name: string | null;
  description: string | null;
  logo: string | null;
  created_by_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
}

export interface SocietyMembership {
  society_id: string;
  user_id: string;
  role_id: SocietyRoleIdEnum | null;
  status: SocietyMembershipStatusEnum | null;
  joined_at: string;
  updated_at: string | null;
}
