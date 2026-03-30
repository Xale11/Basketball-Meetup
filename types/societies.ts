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
  name: string
}

export interface Society {
  id: string;
  university_id: string;
  name: string;
  description: string;
  logo?: string;
  created_by_user_id: string;
  created_at: number;
  updated_at: number;
}

export interface SocietyMembership {
  society_id: string;
  user_id: string;

  role_id: SocietyRoleIdEnum;
  status: SocietyMembershipStatusEnum;

  joined_at: number;
  updated_at: number;
}
