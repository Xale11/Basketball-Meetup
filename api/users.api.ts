import { User } from "@/types/user"
import { supabase } from "./supabase"

/**
 * Returns the profile row for `id`, or `null` when the user has no profile yet
 * (i.e. they have an auth account but have not onboarded).
 *
 * "No row" is a normal, expected state and is NOT an error — returning null
 * rather than throwing is what lets callers tell it apart from a network
 * failure or an RLS denial, which must stay errors.
 */
export const getUserById = async (id: string | undefined | null): Promise<User | null> => {
    if (!id) throw new Error("No Id provided to fetch user - Function: getUserById")

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("[users.api] getUserById failed:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
        })
        throw new Error(error.message)
    }

    return (data as User) ?? null
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

