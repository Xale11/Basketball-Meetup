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
                first_name: user.first_name,
                last_name: user.last_name,
                bio: user.bio,
                over_18: user.over_18,
                photo_url: user.photo_url,
                university_id: user.university_id,
                course: user.course,
                onboarding_status: user.onboarding_status,
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

