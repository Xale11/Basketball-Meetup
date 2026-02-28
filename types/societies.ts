export type SocietyRole =
  | "OWNER"          // (optional) creator / super admin
  | "PRESIDENT"      // top leader
  | "EXEC"           // committee / admin team
  | "MODERATOR"      // can manage content/members, limited
  | "MEMBER";        // standard

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
  id: string;

  societyId: string;
  userId: string;

  role: SocietyRole;
  status: "ACTIVE" | "PENDING" | "BANNED";

  joinedAt: number;

  // OPTIONAL snapshots (to reduce reads in lists)
  userDisplayName?: string;
  userPhotoUrl?: string;
  societyName?: string;

  createdAt: number;
  updatedAt: number;
}