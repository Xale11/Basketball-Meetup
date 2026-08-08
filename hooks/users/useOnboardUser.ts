import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OnboardingStatus, OnboardingUserForm, User } from "@/types/user";
import { createUser } from "@/api/users.api";
import { useAuth } from "@/hooks/useAuth";
import { createSocietyMembership } from "@/api/societies.api";
import { uploadToSupabaseBucket } from "@/api/supabase-storage.api";
import { qk } from "@/lib/queryKeys";

type OnboardUserArgs = {
  form: OnboardingUserForm;
  photoUri?: string;
};

type UseOnboardUserReturn = {
  onboardUser: (args: OnboardUserArgs) => Promise<User>;
  loading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
  // spread mutation result as well
  // (status, reset, mutate, data, etc.)
  [key: string]: any;
};

export function useOnboardUser(): UseOnboardUserReturn {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ form, photoUri }: OnboardUserArgs) => {
      const userId = form.id || session?.user?.id;

      if (!userId) {
        throw new Error("No user id available for onboarding");
      }

      let photoUrl: string | undefined = undefined;
      if (photoUri) {
        // Let the upload error propagate as-is; it already carries a usable
        // message. It used to be re-thrown as JSON.stringify(err), which for an
        // Error instance is the string "{}".
        photoUrl = await uploadToSupabaseBucket(photoUri, `profilePhotos/${userId}`, 'profile');
      }

      const updates: Partial<User> = {
        // Was `session?.user?.id`, which disagreed with the `userId` validated
        // above — if form.id was the one set, the insert went in with id
        // undefined.
        id: userId,
        first_name: form.first_name?.trim(),
        last_name: form.last_name?.trim(),
        bio: form.bio?.trim() || undefined,
        over_18: form.over_18,
        university_id: form.university_id || undefined,
        course: form.course?.trim() || undefined,
        degree: form.degree?.trim() || undefined,
        year_of_study: form.year_of_study?.trim() || undefined,
        photo_url: photoUrl || form.photo_url || undefined,
        onboarding_status: OnboardingStatus.COMPLETED,
      };

      const updatedUser = await createUser(updates);

      // Was `societies.forEach(async ...)`, which returns immediately: the
      // memberships were still in flight when onboarding reported success and
      // any failure was swallowed. Awaited together now, so a failed membership
      // fails the mutation.
      const societies = form.societies ?? [];
      await Promise.all(societies.map((societyId) => createSocietyMembership(userId, societyId)));

      return updatedUser;
    },
    onSuccess: (createdUser) => {
      // The onboarding route guard reads this query. Seed it directly so the
      // guard releases immediately, then invalidate to reconcile with the
      // server. Without this the user is stuck on the onboarding screen.
      if (createdUser?.id) {
        queryClient.setQueryData(qk.users.detail(createdUser.id), createdUser);
      }
      queryClient.invalidateQueries({ queryKey: qk.users.all });
      // Society memberships were just created for this user.
      queryClient.invalidateQueries({ queryKey: qk.societies.mine(createdUser?.id) });
    },
  });

  const onboardUser = useCallback(
    async ({ form, photoUri }: OnboardUserArgs) => {
      return mutation.mutateAsync({ form, photoUri });
    },
    [mutation]
  );

  return {
    ...mutation,
    onboardUser,
    // Explicit, convenient aliases mirroring useFetchById pattern
    loading: mutation.isPending,
    error: (mutation.error as Error) ?? null,
  };
}
