import { useQuery } from "@tanstack/react-query"
import { getSocietiesByUniversityId } from "@/api/societies.api"
import { Society } from "@/types/societies"

const useFetchSocietiesByUniId = (universityId: string | null) => {
    const {
        data,
        error,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery<Society[]>({
        queryKey: ["societies", universityId],
        queryFn: () => {
            if (!universityId) {
                return Promise.resolve([])
            }
            return getSocietiesByUniversityId(universityId)
        },
        enabled: false,
    })

    const fetchSocieties = () => refetch()

    return {
        societies: data ?? [],
        error,
        isLoading,
        isFetching,
        isError,
        fetchSocieties,
    }
}

export default useFetchSocietiesByUniId

