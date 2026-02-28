import { getUserById } from "@/api/users.api"
import { User } from "@/types/user"
import { useQuery } from "@tanstack/react-query"
import { router } from "expo-router"
import { useEffect } from "react"

export const useFetchById = (id: string | undefined | null) => {
    const query = useQuery<User, Error>({
        queryKey: ["userFetchById", id],
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: 2,
        queryFn: async () => {
            const user = await getUserById(id)
            if (!user) {
                console.log("User needs to be onboarded")
                throw new Error("User needs to be onboarded")
            }
            return user
        }
    })

    useEffect(() => {
        if (query.isError === true && query.isFetching === false) {
            console.log('retries done!')
            router.replace("/onboarding/onboarding")
        }

    }, [query.isError, query.isFetching])

    return {
        ...query,
        // Explicit state properties for easier access
        // Include fetchStatus === 'fetching' to ensure retry states show loading
        loading: query.isPending ||
            query.isLoading ||
            query.isFetching ||
            query.isRefetching ||
            query.fetchStatus === 'fetching',
        error: query.error,
        isSuccess: query.isSuccess,
        isError: query.isError,
        // Alias mutate for convenience
        fetchUserById: query.refetch,
    };
}