import { University, UniversityMembership } from "@/types/universities"
import { supabase } from "./supabase"
import { throwSupabaseError } from "@/lib/supabaseError"

export const getUniversityMembershipByUserId = async (userId: string): Promise<UniversityMembership | null> => {
    const { data, error } = await supabase
        .from("university_memberships")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throwSupabaseError('universities.api getUniversityMembershipByUserId', error)

    return (data as UniversityMembership) ?? null
}

export const getUniversities = async (): Promise<University[]> => {
    const { data, error } = await supabase
        .from("universities")
        .select("*")
        .order('name', { ascending: true })

    if (error) throwSupabaseError('universities.api getUniversities', error)

    return (data ?? []) as University[]
}
