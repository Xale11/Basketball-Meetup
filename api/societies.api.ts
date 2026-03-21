import { Society, SocietyMembershipStatusEnum, SocietyRoleIdEnum } from "@/types/societies";
import { supabase } from "./supabase";
import { SocietyMembership } from "@/types/societies";

export type SocietyMembershipWithSociety = SocietyMembership & { societies: Society };

export const getSocietiesByUniversityId = async (universityId: string): Promise<Society[]> => {
    try {
        const { data, error }: { data: Society[] | null; error: any } = await supabase
            .from("societies")
            .select("*")
            .eq("universityId", universityId)
            .order('name', { ascending: true })
        if (error) {
            throw new Error(JSON.stringify(error))
        }
        return data ?? []
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}

export const getSocietyMembershipsByUserId = async (userId: string): Promise<SocietyMembershipWithSociety[]> => {
    try {
        const { data, error } = await supabase
            .from("societyMemberships")
            .select("*, societies(*)")
            .eq("userId", userId)
        if (error) throw new Error(JSON.stringify(error))
        return (data ?? []) as SocietyMembershipWithSociety[]
    } catch (error) {
        throw new Error(JSON.stringify(error))
    }
}

export const createSocietyMembership = async (userId: string, societyId: string): Promise<SocietyMembership | null> => {
    try {
        if (!userId || !societyId) {
            throw new Error("No user id or society id provided to create society membership")
        }
        const { data, error }: { data: SocietyMembership | null; error: any } = await supabase
            .from("societyMemberships")
            .insert({ userId: userId, societyId: societyId, roleId: SocietyRoleIdEnum.MEMBER, status: SocietyMembershipStatusEnum.ACTIVE })
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