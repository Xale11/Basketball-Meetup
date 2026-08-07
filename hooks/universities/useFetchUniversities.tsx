import { useQuery } from "@tanstack/react-query"
import { getUniversities } from "@/api/universities.api"
import { University } from "@/types/universities"
import { qk } from "@/lib/queryKeys"

/**
 * Universities are a small, near-static reference list.
 *
 * This used to be `enabled: false` with a manual `refetch()`, which defeated
 * caching and dedup and forced every consumer to trigger a fetch from an
 * effect. It is now an ordinary query with a long staleTime; the
 * `fetchUniversities` alias is kept so existing call sites keep working.
 */
const useFetchUniversities = () => {
    const query = useQuery<University[]>({
        queryKey: qk.universities.list(),
        queryFn: getUniversities,
        staleTime: 1000 * 60 * 60, // 1 h
    })

    return {
        universities: query.data ?? [],
        error: query.error,
        isLoading: query.isPending,
        loading: query.isPending,
        isFetching: query.isFetching,
        isError: query.isError,
        fetchUniversities: query.refetch,
    }
}

export default useFetchUniversities
