import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSocietyAnnouncement,
  deleteSocietyAnnouncement,
  getSocietyAnnouncements,
} from '@/api/societies.api';
import { SocietyAnnouncementWithAuthor } from '@/types/societies';
import { qk } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';

/** A society's announcements, newest first. */
export const useSocietyAnnouncements = (societyId: string | undefined) => {
  const query = useQuery<SocietyAnnouncementWithAuthor[], Error>({
    queryKey: qk.societies.announcements(societyId),
    queryFn: () => getSocietyAnnouncements(societyId!),
    enabled: !!societyId,
  });

  return {
    announcements: query.data ?? [],
    loading: !!societyId && query.isPending,
  };
};

/**
 * Posting and removing announcements.
 *
 * Permission is enforced by RLS, not here — a non-leader's insert is rejected by
 * the `Leaders can post announcements` policy rather than by a client check.
 */
export const useManageSocietyAnnouncements = (societyId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.societies.announcements(societyId) });
  };

  const create = useMutation<
    unknown,
    Error,
    { title: string; content: string; isImportant?: boolean }
  >({
    mutationFn: ({ title, content, isImportant }) =>
      createSocietyAnnouncement({
        society_id: societyId!,
        author_id: user!.id,
        title,
        content,
        is_important: isImportant,
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => deleteSocietyAnnouncement(id),
    onSuccess: invalidate,
  });

  return {
    postAnnouncement: create.mutate,
    removeAnnouncement: remove.mutate,
    posting: create.isPending,
    removing: remove.isPending,
  };
};
