import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { EventCard } from '@/components/EventCard';
import { mockEvents } from '@/utils/mockData';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/api/firebase';
import { useEffect } from 'react';
import { CreateEventForm } from '@/types/event';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import ngeohash from 'ngeohash';
import TimeInput from '@/components/TimeInput';
import DateTimeInput from '@/components/DateTimeInput';

export default function EventsScreen() {
  const {} = useAuth();

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [form, setForm] = useState<CreateEventForm>({
    title: '',
    description: '',
    courtId: '',
    mainOrganiserType: 'user',
    mainOrganiserId: '',
    organiserUserIds: [],
    organiserClubIds: [],
    startDate: '',
    endDate: '',
    maxParticipants: 0,
    pricing: [],
    ticketDeadline: 'upcoming',
    isCancelled: false,
    createdAt: '',
    acceptingParticipants: true,
    verifyParticipants: false,
  });

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'my-events', label: 'My Events' },
    { key: 'past', label: 'Past' },
  ];

  const addLocationToForm = (loc: GooglePlaceDetail | null) => {
    if (
      !loc ||
      (!loc?.geometry.location.longitude &&
        !loc?.geometry.location.latitude &&
        !loc?.geometry.location.lng &&
        !loc?.geometry.location.lat)
    ) {
      Alert.alert(
        'Error',
        'There was an error setting the location. Please try again. (#Lng/Lat)'
      );
      return;
    } else {
      setForm((prev) => ({
        ...prev,
        address: loc?.formatted_address || loc?.formattedAddress,
        longitude:
          loc?.geometry.location.longitude || loc?.geometry.location.lng,
        latitude: loc?.geometry.location.latitude || loc?.geometry.location.lat,
        geohash: ngeohash.encode(
          loc?.geometry.location.latitude || loc?.geometry.location.lat,
          loc?.geometry.location.longitude || loc?.geometry.location.lng,
          9
        ),
      }));
    }
  };

  const updateEventDateTime = (field: 'startDate' | 'endDate', value: string) => {
    setForm((prev): CreateEventForm => ({ ...prev, [field]: value }));
    return true;
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
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateEvent(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} onPress={() => {}} />
        ))}
      </ScrollView>

      <Modal
        visible={showCreateEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateEvent(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity onPress={() => setShowCreateEvent(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Event Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Event Name *</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(val) =>
                    setForm(
                      (prev): CreateEventForm => ({ ...prev, title: val })
                    )
                  }
                  placeholder="e.g., Community Yoga in the Park"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Address *</Text>
                <View style={styles.addressInput}>
                  <MapPin size={20} color="#666" />
                  <GooglePlacesAutocomplete
                    placeholder="Search for a location"
                    debounce={300}
                    fetchDetails={true}
                    query={{
                      key:
                        Constants.expoConfig?.extra?.googleMapsApiKey ||
                        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                      language: 'en',
                      type: 'establishment',
                    }}
                    onPress={(_, details) => {
                      addLocationToForm(details);
                    }}
                    enablePoweredByContainer={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(val) =>
                    setForm((prev) => ({ ...prev, description: val }))
                  }
                  placeholder="Tell people about this event..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Event Time</Text>
              <View style={styles.timeInputsContainer}>
                <DateTimeInput
                  defaultValue={''}
                  label="Start Time"
                  onChange={(time: string) =>
                    updateEventDateTime('startDate', time)
                  }
                  
                />
                <Text style={styles.timeSeparator}>to</Text>
                <View style={styles.timeInputGroup}>
                  <TimeInput
                    defaultValue={form.endDate}
                    label="End Time"
                    onChange={(time: string) =>
                      updateEventDateTime('endDate', time)
                    }

                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Event Type</Text>
              <View style={styles.eventTypeGrid}>
                {['Tournament', 'Pickup Game', 'Training', 'Club Event'].map(
                  (type) => (
                    <TouchableOpacity key={type} style={styles.eventTypeCard}>
                      <Text style={styles.eventTypeText}>{type}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Quick Setup</Text>
              <View style={styles.quickSetupGrid}>
                <View style={styles.quickSetupItem}>
                  <Calendar size={24} color="#FF6B35" />
                  <Text style={styles.quickSetupText}>Set Date & Time</Text>
                </View>
                <View style={styles.quickSetupItem}>
                  <MapPin size={24} color="#FF6B35" />
                  <Text style={styles.quickSetupText}>Choose Court</Text>
                </View>
                <View style={styles.quickSetupItem}>
                  <Users size={24} color="#FF6B35" />
                  <Text style={styles.quickSetupText}>Max Players</Text>
                </View>
                <View style={styles.quickSetupItem}>
                  <DollarSign size={24} color="#FF6B35" />
                  <Text style={styles.quickSetupText}>Set Price</Text>
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Event Templates</Text>
              <View style={styles.templatesList}>
                {['3v3 Tournament', 'Pickup Game', 'Skills Training'].map(
                  (template) => (
                    <TouchableOpacity
                      key={template}
                      style={styles.templateCard}
                    >
                      <Text style={styles.templateTitle}>{template}</Text>
                      <Text style={styles.templateDescription}>
                        Pre-configured settings for quick setup
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueText}>Continue Setup</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventTypeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  eventTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quickSetupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickSetupItem: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  quickSetupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    textAlign: 'center',
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
