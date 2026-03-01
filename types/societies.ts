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
  universityId: string;
  name: string;
  description: string;
  logo?: string;
  createdByUserId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SocietyMembership {

  societyId: string;
  userId: string;

  roleId: SocietyRoleIdEnum;
  status: SocietyMembershipStatusEnum;

  joinedAt: number;
  updatedAt: number;
}