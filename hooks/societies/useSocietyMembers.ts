import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSocietyMembers, updateSocietyMemberRole, SocietyMemberWithProfile } from '@/api/societies.api';
import { SocietyRoleIdEnum } from '@/types/societies';
import { qk } from '@/lib/queryKeys';

/** Active members of a society, with their profiles. */
export const useSocietyMembers = (societyId: string | undefined) => {
  const query = useQuery<SocietyMemberWithProfile[], Error>({
    queryKey: [...qk.societies.detail(societyId), 'members'],
    queryFn: () => getSocietyMembers(societyId!),
    enabled: !!societyId,
  });

  return {
    members: query.data ?? [],
    loading: !!societyId && query.isPending,
  };
};

/**
 * Promotes a member to Committee, or demotes back to Member.
 *
 * Permission is enforced by the `Leaders can change member roles` RLS policy —
 * a caller without a leadership role gets zero rows back, which the API turns
 * into a readable error rather than a silent no-op.
 */
export const useUpdateMemberRole = (societyId: string | undefined) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    unknown,
    Error,
    { userId: string; roleId: SocietyRoleIdEnum.MEMBER | SocietyRoleIdEnum.EXEC }
  >({
    mutationFn: ({ userId, roleId }) => updateSocietyMemberRole(userId, societyId!, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.societies.all });
    },
  });

  return {
    updateRole: mutation.mutate,
    loading: mutation.isPending,
  };
};
