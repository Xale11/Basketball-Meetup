import { Society, SocietyMembershipStatusEnum, SocietyRoleIdEnum } from "@/types/societies";
import { supabase } from "./supabase";
import { SocietyMembership } from "@/types/societies";

export type SocietyMembershipWithSociety = SocietyMembership & { societies: Society };

export const getSocietiesByUniversityId = async (university_id: string): Promise<Society[]> => {
    try {
        const { data, error }: { data: Society[] | null; error: any } = await supabase
            .from("societies")
            .select("*")
            .eq("university_id", university_id)
            .order('name', { ascending: true })
        if (error) {
            throw new Error(JSON.stringify(error))
        }
        return data ?? []
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}

export const getSocietyMembershipsByUserId = async (user_id: string): Promise<SocietyMembershipWithSociety[]> => {
    try {
        const { data, error } = await supabase
            .from("society_memberships")
            .select("*, societies(*)")
            .eq("user_id", user_id)
        if (error) throw new Error(JSON.stringify(error))
        return (data ?? []) as SocietyMembershipWithSociety[]
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}

export const createSocietyMembership = async (user_id: string, society_id: string): Promise<SocietyMembership | null> => {
    try {
        if (!user_id || !society_id) {
            throw new Error("No user id or society id provided to create society membership")
        }
        const { data, error }: { data: SocietyMembership | null; error: any } = await supabase
            .from("society_memberships")
            .insert({ user_id: user_id, society_id: society_id, role_id: SocietyRoleIdEnum.MEMBER, status: SocietyMembershipStatusEnum.ACTIVE })
            .select("*")
            .maybeSingle()
        if (error) {
            throw new Error(JSON.stringify(error))
        }
        return data
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}