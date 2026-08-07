import { User } from "@/types/user"
import { supabase } from "./supabase"
import { throwSupabaseError } from "@/lib/supabaseError"

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

    if (error) throwSupabaseError('users.api getUserById', error)

    return (data as User) ?? null
}

export const createUser = async (user: Partial<User>): Promise<User> => {
    if (!user.id) throw new Error("No Id provided to create user - Function: createUser")

    const { data, error } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            bio: user.bio,
            over_18: user.over_18,
            photo_url: user.photo_url,
            university_id: user.university_id,
            course: user.course,
            onboarding_status: user.onboarding_status,
        })
        .select("*")
        .maybeSingle()

    if (error) throwSupabaseError('users.api createUser', error)

    return data as User
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    if (!id) throw new Error("No Id provided to update user - Function: updateUser")

    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle()

    if (error) throwSupabaseError('users.api updateUser', error)

    return data as User
}
