import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  X,
  Bell,
  Calendar,
  Clock,
  Users,
  Megaphone,
  CheckCheck,
  Trash2,
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useNotifications,
  useMarkNotificationsRead,
} from '@/hooks/notifications/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/** Icon and tint per notification type. */
const TYPE_META: Record<NotificationType, { icon: LucideIcon; tone: keyof Theme['colors'] }> = {
  [NotificationType.INVITE]: { icon: Calendar, tone: 'accentTone' },
  [NotificationType.REMINDER]: { icon: Clock, tone: 'warningTone' },
  [NotificationType.JOIN]: { icon: Users, tone: 'successTone' },
  [NotificationType.SOCIETY]: { icon: Users, tone: 'infoTone' },
  [NotificationType.ANNOUNCEMENT]: { icon: Megaphone, tone: 'infoTone' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { colors } = theme;

  const { notifications, loading } = useNotifications();
  const { markRead, markAllRead, removeNotification } = useMarkNotificationsRead();

  const hasUnread = notifications.some((n) => !n.read);

  /** Marks read, then follows the notification to whatever it refers to. */
  const openNotification = (n: Notification) => {
    if (!n.read) markRead({ id: n.id });
    if (n.event_id) {
      router.push({ pathname: '/event/[id]', params: { id: n.event_id } });
    } else if (n.society_id) {
      router.push({ pathname: '/society/[id]', params: { id: n.society_id } });
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>Notifications</Text>
          {hasUnread && (
            <Text style={s.subtitle}>
              {notifications.filter((n) => !n.read).length} unread
            </Text>
          )}
        </View>

        {hasUnread && (
          <TouchableOpacity style={s.markAllBtn} onPress={() => markAllRead()} hitSlop={6}>
            <CheckCheck size={15} color={colors.accentText} />
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.closeButton}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={s.loader} />
        ) : notifications.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="Nothing yet"
            subtitle="Invites, reminders and society updates will show up here."
          />
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, tone: 'neutralTone' as const };
            const tone = colors[meta.tone] as Theme['colors']['accentTone'];
            const Icon = meta.icon;

            return (
              <TouchableOpacity
                key={n.id}
                style={[s.card, !n.read && s.cardUnread]}
                onPress={() => openNotification(n)}
                activeOpacity={0.85}
              >
                <View style={[s.iconWrap, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                  <Icon size={16} color={tone.solid} />
                </View>

                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    {!n.read && <View style={s.unreadDot} />}
                    <Text style={s.cardTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={s.cardTime}>{relativeTime(n.created_at)}</Text>
                  </View>
                  <Text style={s.cardMessage}>{n.message}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => removeNotification({ id: n.id })}
                  hitSlop={8}
                  accessibilityLabel="Delete notification"
                >
                  <Trash2 size={15} color={colors.textFaint} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.canvas },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.chromeBorder,
    },
    headerText: { flex: 1, gap: 2 },
    title: { ...t.typography.h1, color: t.colors.textPrimary },
    subtitle: { ...t.typography.caption, color: t.colors.textMuted },
    markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    markAllText: { ...t.typography.badge, fontSize: 11, color: t.colors.accentText },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },

    listContent: { padding: t.spacing.lg, gap: t.spacing.sm },
    loader: { marginTop: t.spacing.xxl },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    // Unread carries an accent hairline rather than a fill, so a long list
    // doesn't become a wall of colour.
    cardUnread: { borderColor: t.colors.accentTone.border },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: t.radius.chip,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cardBody: { flex: 1, gap: 3 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: t.colors.accent,
    },
    cardTitle: { ...t.typography.bodyStrong, color: t.colors.textPrimary, flex: 1 },
    cardTime: { ...t.typography.caption, fontSize: 11, color: t.colors.textFaint },
    cardMessage: { ...t.typography.caption, color: t.colors.textMuted, lineHeight: 17 },
  });
