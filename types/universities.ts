export enum UniversityRole {
    STUDENT = 'STUDENT',
    STAFF = 'STAFF',
    ADMIN = 'ADMIN',
}

export interface University {
    id: string
    name: string
}

export interface UniversityMembership {
    user_id: string
    university_id: string
    role: UniversityRole
    created_at: number
    updated_at: number
}