/**
 * Supabase table: notifications
 * Per-user activity notices backing the header bell and the notifications screen.
 * FK: user_id → profiles.id, event_id → events.id, society_id → societies.id.
 *
 * Clients have SELECT / UPDATE / DELETE on their own rows but NOT insert —
 * a notification asserts that something happened, so rows are created
 * server-side through `create_notification()`, which only `service_role` may
 * execute. See supabase/migrations/20260808091251_notifications.sql.
 */
export enum NotificationType {
  INVITE = 'INVITE',
  REMINDER = 'REMINDER',
  JOIN = 'JOIN',
  SOCIETY = 'SOCIETY',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  event_id: string | null;
  society_id: string | null;
  created_at: string;
}
