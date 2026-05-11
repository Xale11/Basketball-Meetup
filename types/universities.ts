export enum UniversityRole {
    STUDENT = 'STUDENT',
    STAFF = 'STAFF',
    ADMIN = 'ADMIN',
}

export interface University {
    id: string
    name: string | null
    status: string
}

export interface UniversityMembership {
    user_id: string
    university_id: string
    role: UniversityRole
    created_at: string
    updated_at: string
}