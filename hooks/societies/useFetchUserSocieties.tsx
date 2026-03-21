import { useQuery } from "@tanstack/react-query";
import { getSocietyMembershipsByUserId, SocietyMembershipWithSociety } from "@/api/societies.api";

const useFetchUserSocieties = (userId: string | undefined | null) => {
    const { data, error, isLoading, isFetching, isError } = useQuery<SocietyMembershipWithSociety[]>({
        queryKey: ["userSocieties", userId],
        queryFn: () => getSocietyMembershipsByUserId(userId!),
        enabled: !!userId,
    });

    return {
        memberships: data ?? [],
        isLoading,
        isFetching,
        isError,
        error,
    };
};

export default useFetchUserSocieties;
