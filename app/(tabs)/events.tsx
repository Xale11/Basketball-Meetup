import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react-native';
import { EventCard } from '@/components/events/EventCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TabBar } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventFormModal } from '@/components/events/EventFormModal';
import { CreateEventForm, Event, EventHostType } from '@/types/event';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchMyEvents } from '@/hooks/events/useFetchMyEvents';
import { useUpdateEvent } from '@/hooks/events/useUpdateEvent';
import { useUserParticipations } from '@/hooks/events/useUserParticipations';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useFetchUniversityMembership } from '@/hooks/universities/useFetchUniversityMembership';
import { useAuth } from '@/hooks/useAuth';
import { SocietyRoleIdEnum } from '@/types/societies';
import { UniversityRole } from '@/types/universities';
import { Alert } from 'react-native';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'my-events', label: 'My Events' },
  { key: 'past', label: 'Past' },
];

const EMPTY_CONFIG: Record<string, { emoji: string; title: string; subtitle: string }> = {
  upcoming: {
    emoji: '✨',
    title: "Nothing on the schedule yet!",
    subtitle: "Be the first to get something going — hit that + button and make it happen.",
  },
  'my-events': {
    emoji: '🎉',
    title: "You haven't created any events yet!",
    subtitle: "The fun starts with you. Create your first event and bring people together.",
  },
  past: {
    emoji: '📸',
    title: "No memories made here… yet!",
    subtitle: "Go create something epic and it'll live here forever.",
  },
};

export default function EventsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const { user } = useAuth();
  const { memberships } = useFetchUserSocieties(user?.id);
  const societyIds = memberships.map((m) => m.society_id);
  const { events, loading: eventsLoading } = useFetchEvents(user?.university_id, societyIds);
  const { events: myEvents } = useFetchMyEvents(user?.id);
  const { createEvent, loading: createLoading } = useCreateEvent();
  const { updateEvent, loading: updateLoading } = useUpdateEvent();
  const { membership: uniMembership } = useFetchUniversityMembership(user?.id);
  const { participationMap } = useUserParticipations(user?.id);

  const privilegedSocietyIds = new Set(
    memberships
      .filter((m) =>
        [SocietyRoleIdEnum.EXEC, SocietyRoleIdEnum.PRESIDENT, SocietyRoleIdEnum.OWNER].includes(m.role_id),
      )
      .map((m) => m.society_id),
  );
  const isUniAdmin = uniMembership?.role === UniversityRole.ADMIN;

  const now = new Date().toISOString();
  const upcomingEvents = events.filter((e) => e.end_date >= now);
  const pastEvents = events.filter((e) => e.end_date < now);

  const visibleEvents =
    selectedTab === 'upcoming' ? upcomingEvents
    : selectedTab === 'my-events' ? myEvents
    : pastEvents;

  const handleOpen = (event?: Event) => {
    setEditingEvent(event ?? null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSubmit = (form: CreateEventForm) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, form, {
        onSuccess: handleClose,
        onError: (err) => Alert.alert('Error', err.message),
      });
    } else {
      createEvent(form, {
        onSuccess: handleClose,
        onError: (err) => Alert.alert('Error', err.message),
      });
    }
  };

  const canEditEvent = (event: Event) =>
    event.created_by_user_id === user?.id ||
    (event.host_type === EventHostType.SOCIETY &&
      event.society_id != null &&
      privilegedSocietyIds.has(event.society_id)) ||
    (event.host_type === EventHostType.UNIVERSITY && isUniAdmin);

  const emptyState = EMPTY_CONFIG[selectedTab] ?? {
    emoji: '✨',
    title: 'Nothing here yet!',
    subtitle: 'Check back soon.',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={() => handleOpen()}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <TabBar tabs={TABS} activeTab={selectedTab} onTabChange={setSelectedTab} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {eventsLoading ? (
          <LoadingSpinner />
        ) : visibleEvents.length === 0 ? (
          <EmptyState {...emptyState} />
        ) : (
          visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              participantStatus={participationMap.get(event.id) ?? null}
              onPress={selectedTab === 'my-events' && (
                event.created_by_user_id === user?.id ||
                (event.host_type === EventHostType.SOCIETY && event.society_id != null && privilegedSocietyIds.has(event.society_id)) ||
                (event.host_type === EventHostType.UNIVERSITY && isUniAdmin)
              ) ? () => openEdit(event) : () => {}}
            />
          ))
        )}
      </ScrollView>

      <EventFormModal
        visible={showModal}
        editingEvent={editingEvent}
        memberships={memberships}
        user={user ?? null}
        onClose={handleClose}
        onSubmit={handleSubmit}
        loading={createLoading || updateLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  createButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
});
