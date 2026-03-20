import { University } from "@/types/universities"
import { supabase } from "./supabase"

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