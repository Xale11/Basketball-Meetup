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
        if (error){
            throw new Error(JSON.stringify(error))
        }
        return data as User
    } catch (error: any) {
        throw new Error(error.message)
    }
}