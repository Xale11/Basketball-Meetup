import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateUser } from '@/api/users.api';
import { User } from '@/types/user';

export default function useUpdateUser(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const updateProfile = async (updates: Partial<User>) => {
    if (!userId) return;
    try {
      setSaving(true);
      console.log('[useUpdateUser] saving profile');
      await updateUser(userId, updates);
      await queryClient.invalidateQueries({ queryKey: ['userFetchById', userId] });
      console.log('[useUpdateUser] profile saved');
    } catch (e) {
      console.error('[useUpdateUser] save failed', e);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  return { saving, updateProfile };
}
