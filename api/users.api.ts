import { User } from "@/types/user"
import { supabase } from "./supabase"

export const getUserById = async (id: string | undefined | null): Promise<User> => {
    try {
        if (!id) throw new Error("No Id provided to fetch user - Function: getUserById")
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .maybeSingle()
        console.log('getUserById data:', data)
        if (error) {
            throw new Error(JSON.stringify(error))
        }
        return data as User
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export const createUser = async (user: Partial<User>): Promise<User> => {
    try {
        if (!user.id) throw new Error("No Id provided to create user - Function: createUser")
            
            const insertObject = {
                id: user.id,
                bio: user.bio,
                over18: user.over18,
                photoUrl: user.photoUrl,
                universityId: user.universityId,
                course: user.course,
                onboardingStatus: user.onboardingStatus,
            }
        
            const { data, error }: { data: User | null; error: any } = await supabase
            .from("profiles")
            .insert(insertObject)
            .select("*")
            .maybeSingle()

            
        if (error) {
            throw new Error(JSON.stringify(error))
        }

        return data as User
    } catch (error: any) {
        console.error("error", error);
        throw new Error(error.message)
    }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    try {
        if (!id) throw new Error("No Id provided to update user - Function: updateUser")

        const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", id)
            .select("*")
            .maybeSingle()

        if (error) {
            throw new Error(JSON.stringify(error))
        }

        return data as User
    } catch (error: any) {
        console.error("error", error);
        throw new Error(error.message)
    }
}

