import { supabase } from './supabase';
import { throwSupabaseError } from '@/lib/supabaseError';
import { Notification } from '@/types/notification';

/**
 * There is no `createNotification` here on purpose.
 *
 * `notifications` has no INSERT policy for `authenticated` — a notification
 * asserts that something happened to someone, so letting clients write them
 * would let any user fabricate one for anybody else. Rows are created
 * server-side via `create_notification()`, which only `service_role` may
 * execute. See supabase/migrations/20260808091251_notifications.sql.
 */

export const getNotifications = async (user_id: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throwSupabaseError('notifications.api getNotifications', error);
  return (data ?? []) as Notification[];
};

export const getUnreadNotificationCount = async (user_id: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('read', false);

  if (error) throwSupabaseError('notifications.api getUnreadNotificationCount', error);
  return count ?? 0;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throwSupabaseError('notifications.api markNotificationRead', error);
};

/** Scoped by user_id as well as `read` so the update matches the RLS predicate. */
export const markAllNotificationsRead = async (user_id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user_id)
    .eq('read', false);

  if (error) throwSupabaseError('notifications.api markAllNotificationsRead', error);
};

export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throwSupabaseError('notifications.api deleteNotification', error);
};
