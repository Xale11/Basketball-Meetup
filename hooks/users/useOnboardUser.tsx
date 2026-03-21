import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { OnboardingStatus, OnboardingUserForm, User } from "@/types/user";
import { createUser } from "@/api/users.api";
import { useAuth } from "@/hooks/useAuth";
import { createSocietyMembership } from "@/api/societies.api";
import { uploadToSupabaseBucket } from "@/api/supabase-storage.api";

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

export default function useOnboardUser(): UseOnboardUserReturn {
  const { session } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ form, photoUri }: OnboardUserArgs) => {
      console.log("[useOnboardUser] start onboarding");

      const userId = form.id || session?.user?.id;

      if (!userId) {
        console.error("[useOnboardUser] onboarding failed: missing userId");
        throw new Error("No user id available for onboarding");
      }

      let photoUrl: string | undefined = undefined;
      if (photoUri) {
        console.log("[useOnboardUser] uploading profile photo");
        try {
          photoUrl = await uploadToSupabaseBucket(photoUri, `profilePhotos/${userId}`, 'profile');
          console.log("[useOnboardUser] photo upload success");
        } catch (uploadError) {
          console.error("[useOnboardUser] photo upload failed", uploadError);
          throw new Error(JSON.stringify(uploadError));
        }
      }

      const updates: Partial<User> = {
        id: session?.user?.id,
        name: form.name?.trim(),
        bio: form.bio?.trim() || undefined,
        over18: form.over18,
        universityId: form.universityId || undefined,
        course: form.course?.trim() || undefined,
        photoUrl: photoUrl || form.photoUrl || undefined,
        onboardingStatus: OnboardingStatus.COMPLETED,
      };

      console.log(`[useOnboardUser] creating user for userId=${userId}`);

      const updatedUser = await (async () => {
        try {
          const user = await createUser(updates);
          console.log(`[useOnboardUser] user created (id=${user?.id})`);
          return user;
        } catch (err) {
          console.error("[useOnboardUser] createUser failed", err);
          throw err;
        }
      })();

      const societies = form.societies ?? [];
      console.log(`[useOnboardUser] creating ${societies.length} society memberships`);

      societies.forEach(async (societyId) => {
        console.log(`[useOnboardUser] creating membership for societyId=${societyId}`);

        const societyMembership = await createSocietyMembership(userId, societyId);
        if (societyMembership) {
          console.log(`[useOnboardUser] membership created for societyId=${societyId}`);
        } else {
          console.error(`[useOnboardUser] membership failed for societyId=${societyId}`);
        }
      });

      console.log(`[useOnboardUser] onboarding done (userId=${updatedUser?.id})`);
      return updatedUser;
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
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}

