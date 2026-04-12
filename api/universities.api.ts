import { University, UniversityMembership } from "@/types/universities"
import { supabase } from "./supabase"

export const getUniversityMembershipByUserId = async (userId: string): Promise<UniversityMembership | null> => {
    try {
        const { data, error } = await supabase
            .from("university_memberships")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle()
        if (error) throw new Error(error.message)
        return data as UniversityMembership | null
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}

export const getUniversities = async (): Promise<University[]> => {
    try {
        const { data, error } = await supabase
            .from("universities")
            .select("*")
            .order('name', { ascending: true })
        if (error) {
            throw new Error(error.message)
        }
        if (!data) {
            throw new Error('Failed to fetch universities')
        }
        return data as University[]
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}