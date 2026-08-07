import { getUserById } from "@/api/users.api"
import { User } from "@/types/user"
import { useQuery } from "@tanstack/react-query"

/**
 * Fetches a profile row. Resolves to `null` when the user has not onboarded yet.
 *
 * This hook deliberately does NOT navigate. It is mounted inside AuthProvider,
 * so it is always live — redirecting from here moved the user out of whatever
 * screen they were on whenever the query errored (including on a transient
 * network failure). Onboarding is decided by the route guard in app/_layout.tsx
 * off the returned value instead.
 */
export const useFetchById = (id: string | undefined | null) => {
    const query = useQuery<User | null, Error>({
        queryKey: ["userFetchById", id],
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: 2,
        queryFn: () => getUserById(id),
    })

    return {
        ...query,
        // `loading` means "we have no data yet", NOT "a refetch is in flight".
        // Anything that gates navigation or a full-screen spinner must use this
        // and never `isFetching`, or every background refetch tears down the UI.
        loading: !!id && query.isPending,
        // Exposed separately for subtle in-place indicators.
        fetching: query.isFetching,
        error: query.error,
        isSuccess: query.isSuccess,
        isError: query.isError,
        fetchUserById: query.refetch,
    };
}
