export enum UniversityStatusEnum {
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED"
}

export interface University {
    id: string
    name: string
    status: University
}