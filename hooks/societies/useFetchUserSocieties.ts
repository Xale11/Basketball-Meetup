import { useQuery } from "@tanstack/react-query";
import { getSocietyMembershipsByUserId, SocietyMembershipWithSociety } from "@/api/societies.api";
import { qk } from "@/lib/queryKeys";

export const useFetchUserSocieties = (userId: string | undefined | null) => {
    // staleTime now comes from the shared client defaults; this query used to
    // omit it entirely and so refetched far more eagerly than every other screen.
    const query = useQuery<SocietyMembershipWithSociety[]>({
        queryKey: qk.societies.mine(userId),
        queryFn: () => getSocietyMembershipsByUserId(userId!),
        enabled: !!userId,
    });

    return {
        memberships: query.data ?? [],
        isLoading: !!userId && query.isPending,
        loading: !!userId && query.isPending,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
};
