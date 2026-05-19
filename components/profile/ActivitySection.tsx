import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Clock, MapPin } from 'lucide-react-native';
import { Event } from '@/types/event';
import { TabBar } from '@/components/ui/TabBar';

type ActivityTab = 'upcoming' | 'created' | 'past';

const ACTIVITY_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'created', label: 'Created' },
  { key: 'past', label: 'Past' },
];

interface ActivitySectionProps {
  myEvents: Event[];
  participantEvents: Event[];
  myEventsLoading: boolean;
  participantEventsLoading: boolean;
}

export function ActivitySection({
  myEvents,
  participantEvents,
  myEventsLoading,
  participantEventsLoading,
}: ActivitySectionProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('upcoming');

  const now = new Date();
  const upcomingEvents = participantEvents.filter((e) => new Date(e.start_date) > now);
  const createdEvents = myEvents.filter((e) => new Date(e.start_date) > now);
  const pastEvents = participantEvents.filter((e) => new Date(e.end_date) < now);

  const isLoading = activeTab === 'created' ? myEventsLoading : participantEventsLoading;
  const events =
    activeTab === 'upcoming' ? upcomingEvents : activeTab === 'created' ? createdEvents : pastEvents;

  return (
    <View>
      <TabBar
        tabs={ACTIVITY_TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as ActivityTab)}
        style={styles.tabBar}
      />

      {isLoading ? (
        <Text style={styles.helperText}>Loading…</Text>
      ) : events.length === 0 ? (
        <Text style={styles.helperText}>Nothing here yet.</Text>
      ) : (
        events.map((e) => {
          const startDate = new Date(e.start_date);
          const isToday = startDate.toDateString() === now.toDateString();
          const timeLabel = isToday
            ? `Today · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
            : `${startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
          const isHosting = activeTab === 'created';
          const isPast = activeTab === 'past';

          return (
            <View key={e.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{e.name}</Text>
                <View style={styles.itemMeta}>
                  <Clock size={12} color="#888" />
                  <Text style={styles.itemMetaText}>{timeLabel}</Text>
                  {e.address && (
                    <>
                      <MapPin size={12} color="#888" />
                      <Text style={styles.itemMetaText}>{e.address}</Text>
                    </>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isHosting && styles.statusHosting,
                  isPast && styles.statusCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isHosting && styles.statusTextHosting,
                    isPast && styles.statusTextCompleted,
                  ]}
                >
                  {isHosting ? 'Hosting' : isPast ? 'Attended' : 'Going'}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  helperText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  itemMetaText: { fontSize: 12, color: '#888' },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusHosting: { backgroundColor: '#FFF4F0' },
  statusCompleted: { backgroundColor: '#F0F0F0' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#28A745' },
  statusTextHosting: { color: '#FF6B35' },
  statusTextCompleted: { color: '#666' },
});
