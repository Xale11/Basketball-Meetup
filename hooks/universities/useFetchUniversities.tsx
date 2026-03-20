import { useQuery } from "@tanstack/react-query"
import { getUniversities } from "@/api/universities.api"
import { University } from "@/types/universities"

const useFetchUniversities = () => {
    const {
        data,
        error,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery<University[]>({
        queryKey: ["universities"],
        queryFn: getUniversities,
        enabled: false,
    })

    const fetchUniversities = () => refetch()

    return {
        universities: data ?? [],
        error,
        isLoading,
        isFetching,
        isError,
        fetchUniversities,
    }
}

export default useFetchUniversities