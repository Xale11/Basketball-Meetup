import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Search, Filter, Plus, MapPin } from 'lucide-react-native';
import { EventCard } from '@/components/EventCard';
import { ImagePicker } from '@/components/ImagePicker';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  CreateEventForm,
  EventBookingMode,
  EventHostType,
  EventJoinPolicy,
  EventVisibility,
} from '@/types/event';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useFetchEvents } from '@/hooks/events/useFetchEvents';
import { useFetchMyEvents } from '@/hooks/events/useFetchMyEvents';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useAuth } from '@/hooks/useAuth';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import DateTimeInput from '@/components/DateTimeInput';

const VISIBILITY_OPTIONS: { label: string; value: EventVisibility }[] = [
  { label: 'Public', value: EventVisibility.PUBLIC },
  { label: 'Society Only', value: EventVisibility.SOCIETY_ONLY },
  { label: 'University Only', value: EventVisibility.UNIVERSITY_ONLY },
  { label: 'Private', value: EventVisibility.PRIVATE },
];

const JOIN_POLICY_OPTIONS: { label: string; value: EventJoinPolicy }[] = [
  { label: 'Open', value: EventJoinPolicy.OPEN },
  { label: 'Approval Required', value: EventJoinPolicy.APPROVAL_REQUIRED },
  { label: 'Invite Only', value: EventJoinPolicy.INVITE_ONLY },
];

const HOST_TYPE_OPTIONS: { label: string; value: EventHostType }[] = [
  { label: 'Personal', value: EventHostType.USER },
  { label: 'Society', value: EventHostType.SOCIETY },
  { label: 'University', value: EventHostType.UNIVERSITY },
];

const INITIAL_FORM: CreateEventForm = {
  name: '',
  description: null,
  start_date: '',
  end_date: '',
  is_online: false,
  address: null,
  latitude: null,
  longitude: null,
  visibility: EventVisibility.PUBLIC,
  join_policy: EventJoinPolicy.OPEN,
  max_participants: null,
  host_type: EventHostType.USER,
  society_id: null,
  university_id: null,
  banner_image_url: null,
  banner_image_uri: null,
  gallery_image_uris: [],
  booking_mode: EventBookingMode.FREE,
  price_from: null,
  currency: null,
};

export default function EventsScreen() {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  const [dateError, setDateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { events, loading: eventsLoading } = useFetchEvents();
  const { events: myEvents } = useFetchMyEvents(user?.id);
  const { createEvent } = useCreateEvent();
  const { memberships } = useFetchUserSocieties(user?.id);

  const needsSociety =
    form.host_type === EventHostType.SOCIETY ||
    form.visibility === EventVisibility.SOCIETY_ONLY;

  const now = new Date().toISOString();
  const upcomingEvents = events.filter((e) => e.end_date >= now);
  const pastEvents = events.filter((e) => e.end_date < now);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Event name is required.';
    if (!form.start_date) errors.start_date = 'Start date is required.';
    if (!form.end_date) errors.end_date = 'End date is required.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      errors.end_date = 'End date must be after the start date.';
    }
    if (!form.is_online && !form.address) errors.address = 'Address is required for in-person events.';
    if (needsSociety && memberships.length > 0 && !form.society_id) errors.society_id = 'Please select a society.';
    if (form.booking_mode === EventBookingMode.TICKETED && !form.price_from) {
      errors.price_from = 'A starting price is required for ticketed events.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    createEvent(form, {
      onSuccess: () => {
        setShowCreateEvent(false);
        setForm(INITIAL_FORM);
        setFormErrors({});
      },
      onError: (err) => Alert.alert('Error', err.message),
    });
  };

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
      Alert.alert('Error', 'There was an error setting the location. Please try again.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      address: loc?.formatted_address || loc?.formattedAddress || null,
      longitude: loc?.geometry.location.longitude || loc?.geometry.location.lng,
      latitude: loc?.geometry.location.latitude || loc?.geometry.location.lat,
    }));
  };

  const handleClose = () => {
    setShowCreateEvent(false);
    setForm(INITIAL_FORM);
    setDateError(null);
    setFormErrors({});
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
        {eventsLoading ? (
          <LoadingSpinner />
        ) : (() => {
          const visibleEvents =
            selectedTab === 'upcoming' ? upcomingEvents
            : selectedTab === 'my-events' ? myEvents
            : pastEvents;

          if (visibleEvents.length === 0) {
            const emptyConfig = {
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
            }[selectedTab] ?? {
              emoji: '✨',
              title: "Nothing here yet!",
              subtitle: "Check back soon.",
            };

            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{emptyConfig.emoji}</Text>
                <Text style={styles.emptyTitle}>{emptyConfig.title}</Text>
                <Text style={styles.emptySubtitle}>{emptyConfig.subtitle}</Text>
              </View>
            );
          }

          return visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} onPress={() => {}} />
          ));
        })()}
      </ScrollView>

      <Modal
        visible={showCreateEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Basic Info</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Event Name *</Text>
                <TextInput
                  style={[styles.input, formErrors.name ? styles.inputError : null]}
                  value={form.name}
                  onChangeText={(val) => {
                    setForm((p) => ({ ...p, name: val }));
                    if (val.trim()) setFormErrors((e) => ({ ...e, name: undefined as any }));
                  }}
                  placeholder="What's the event called?"
                  placeholderTextColor="#999"
                />
                {formErrors.name && <Text style={styles.fieldError}>{formErrors.name}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.noMarginBottom]}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description ?? ''}
                  onChangeText={(val) =>
                    setForm((p) => ({ ...p, description: val || null }))
                  }
                  placeholder="Tell people what this event is about..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <DateTimeInput
                  label="Start"
                  defaultValue="Select start"
                  onChange={(val) => {
                    setForm((p) => {
                      const newEnd = p.end_date && p.end_date <= val ? '' : p.end_date;
                      if (p.end_date && p.end_date <= val) {
                        setDateError('End date must be after the start date.');
                      } else {
                        setDateError(null);
                      }
                      return { ...p, start_date: val, end_date: newEnd };
                    });
                    setFormErrors((e) => ({ ...e, start_date: undefined as any }));
                    return true;
                  }}
                />
                <Text style={styles.dateSeparator}>to</Text>
                <DateTimeInput
                  label="End"
                  defaultValue="Select end"
                  onChange={(val) => {
                    if (form.start_date && val <= form.start_date) {
                      setDateError('End date must be after the start date.');
                      return false;
                    }
                    setDateError(null);
                    setForm((p) => ({ ...p, end_date: val }));
                    setFormErrors((e) => ({ ...e, end_date: undefined as any }));
                    return true;
                  }}
                />
              </View>
              {(dateError || formErrors.start_date || formErrors.end_date) && (
                <Text style={styles.dateError}>
                  {dateError || formErrors.start_date || formErrors.end_date}
                </Text>
              )}
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Location</Text>

              <View style={styles.toggleRow}>
                <Text style={styles.formLabel}>Online event</Text>
                <Switch
                  value={form.is_online}
                  onValueChange={(val) =>
                    setForm((p) => ({
                      ...p,
                      is_online: val,
                      address: val ? null : p.address,
                      latitude: val ? null : p.latitude,
                      longitude: val ? null : p.longitude,
                    }))
                  }
                  trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {!form.is_online && (
                <View style={[styles.inputGroup, styles.noMarginBottom]}>
                  <Text style={styles.formLabel}>Address *</Text>
                  <View style={[styles.addressInputWrapper, formErrors.address ? styles.inputError : null]}>
                    <MapPin size={18} color="#666" />
                    <GooglePlacesAutocomplete
                      placeholder="Search for a venue or address"
                      debounce={300}
                      fetchDetails={true}
                      query={{
                        key:
                          Constants.expoConfig?.extra?.googleMapsApiKey ||
                          process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                        language: 'en',
                      }}
                      onPress={(_, details) => {
                        addLocationToForm(details);
                        setFormErrors((e) => ({ ...e, address: undefined as any }));
                      }}
                      enablePoweredByContainer={false}
                      styles={{
                        textInput: styles.googleInput,
                        container: { flex: 1 },
                        listView: { backgroundColor: '#FFFFFF', borderRadius: 8 },
                      }}
                    />
                  </View>
                  {formErrors.address && <Text style={styles.fieldError}>{formErrors.address}</Text>}
                </View>
              )}
            </View>

            {/* Visibility */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Visibility</Text>
              <Text style={styles.formSubtitle}>Who can see this event?</Text>
              <View style={styles.pillRow}>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, form.visibility === opt.value && styles.pillActive]}
                    onPress={() => {
                      const newNeedsSociety =
                        form.host_type === EventHostType.SOCIETY ||
                        opt.value === EventVisibility.SOCIETY_ONLY;
                      setForm((p) => ({
                        ...p,
                        visibility: opt.value,
                        university_id: user?.university_id ?? null,
                        society_id: newNeedsSociety ? (memberships[0]?.society_id ?? null) : null,
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        form.visibility === opt.value && styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Join Policy */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Who Can Join</Text>
              <Text style={styles.formSubtitle}>How do people get in?</Text>
              <View style={styles.pillRow}>
                {JOIN_POLICY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, form.join_policy === opt.value && styles.pillActive]}
                    onPress={() => setForm((p) => ({ ...p, join_policy: opt.value }))}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        form.join_policy === opt.value && styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Host */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Hosted By</Text>
              <Text style={styles.formSubtitle}>Who is organising this event?</Text>
              <View style={styles.pillRow}>
                {HOST_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, form.host_type === opt.value && styles.pillActive]}
                    onPress={() => {
                      const newNeedsSociety =
                        opt.value === EventHostType.SOCIETY ||
                        form.visibility === EventVisibility.SOCIETY_ONLY;
                      setForm((p) => ({
                        ...p,
                        host_type: opt.value,
                        university_id: user?.university_id ?? null,
                        society_id: newNeedsSociety ? (memberships[0]?.society_id ?? null) : null,
                      }));
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        form.host_type === opt.value && styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {needsSociety && memberships.length > 1 && (
                <View style={[styles.inputGroup, { marginTop: 16, marginBottom: 0 }]}>
                  <Text style={styles.formLabel}>Which society?</Text>
                  <View style={styles.pillRow}>
                    {memberships.map((m) => (
                      <TouchableOpacity
                        key={m.society_id}
                        style={[styles.pill, form.society_id === m.society_id && styles.pillActive]}
                        onPress={() => {
                          setForm((p) => ({ ...p, society_id: m.society_id }));
                          setFormErrors((e) => ({ ...e, society_id: undefined as any }));
                        }}
                      >
                        <Text style={[styles.pillText, form.society_id === m.society_id && styles.pillTextActive]}>
                          {m.societies.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {formErrors.society_id && <Text style={styles.fieldError}>{formErrors.society_id}</Text>}
                </View>
              )}

              {needsSociety && memberships.length === 1 && (
                <View style={[styles.autoPopulatedTag, { marginTop: 14 }]}>
                  <Text style={styles.autoPopulatedLabel}>Society</Text>
                  <Text style={styles.autoPopulatedValue}>{memberships[0].societies.name}</Text>
                </View>
              )}

              {needsSociety && memberships.length === 0 && (
                <Text style={[styles.formSubtitle, { marginTop: 12 }]}>
                  You're not a member of any society yet.
                </Text>
              )}
            </View>

            {/* Capacity */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Capacity</Text>
              <View style={[styles.inputGroup, styles.noMarginBottom]}>
                <Text style={styles.formLabel}>Max Participants</Text>
                <TextInput
                  style={styles.input}
                  value={form.max_participants?.toString() ?? ''}
                  onChangeText={(val) =>
                    setForm((p) => ({
                      ...p,
                      max_participants: val ? parseInt(val, 10) || null : null,
                    }))
                  }
                  placeholder="Leave blank for unlimited"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Images */}
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>Images</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Banner Image</Text>
                <ImagePicker
                  placeholder="Add Banner Image"
                  selectedImage={form.banner_image_uri ?? undefined}
                  onImageSelected={(uri) => setForm((p) => ({ ...p, banner_image_uri: uri }))}
                  onImageRemoved={() => setForm((p) => ({ ...p, banner_image_uri: null }))}
                />
              </View>

              <View style={styles.noMarginBottom}>
                <Text style={styles.formLabel}>Gallery Photos</Text>
                <Text style={styles.formSubtitle}>Add extra photos for the event.</Text>
                <View style={styles.galleryGrid}>
                  {form.gallery_image_uris.map((uri, index) => (
                    <ImagePicker
                      key={index}
                      selectedImage={uri}
                      onImageSelected={(newUri) =>
                        setForm((p) => {
                          const updated = [...p.gallery_image_uris];
                          updated[index] = newUri;
                          return { ...p, gallery_image_uris: updated };
                        })
                      }
                      onImageRemoved={() =>
                        setForm((p) => ({
                          ...p,
                          gallery_image_uris: p.gallery_image_uris.filter((_, i) => i !== index),
                        }))
                      }
                    />
                  ))}
                  {form.gallery_image_uris.length < 6 && (
                    <ImagePicker
                      placeholder="Add Photo"
                      onImageSelected={(uri) =>
                        setForm((p) => ({
                          ...p,
                          gallery_image_uris: [...p.gallery_image_uris, uri],
                        }))
                      }
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Booking */}
            <View style={[styles.formSection, styles.lastSection]}>
              <Text style={styles.formTitle}>Booking</Text>

              <View style={styles.bookingToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.bookingOption,
                    form.booking_mode === EventBookingMode.FREE && styles.bookingOptionActive,
                  ]}
                  onPress={() =>
                    setForm((p) => ({
                      ...p,
                      booking_mode: EventBookingMode.FREE,
                      price_from: null,
                      currency: null,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.bookingOptionText,
                      form.booking_mode === EventBookingMode.FREE && styles.bookingOptionTextActive,
                    ]}
                  >
                    Free
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bookingOption,
                    form.booking_mode === EventBookingMode.TICKETED && styles.bookingOptionActive,
                  ]}
                  onPress={() =>
                    setForm((p) => ({ ...p, booking_mode: EventBookingMode.TICKETED }))
                  }
                >
                  <Text
                    style={[
                      styles.bookingOptionText,
                      form.booking_mode === EventBookingMode.TICKETED &&
                        styles.bookingOptionTextActive,
                    ]}
                  >
                    Ticketed
                  </Text>
                </TouchableOpacity>
              </View>

              {form.booking_mode === EventBookingMode.TICKETED && (
                <View style={[styles.inputGroup, { marginTop: 16 }]}>
                  <Text style={styles.formLabel}>Starting Price *</Text>
                  <TextInput
                    style={[styles.input, formErrors.price_from ? styles.inputError : null]}
                    value={form.price_from?.toString() ?? ''}
                    onChangeText={(val) => {
                      setForm((p) => ({
                        ...p,
                        price_from: val ? parseFloat(val) || null : null,
                      }));
                      if (val) setFormErrors((e) => ({ ...e, price_from: undefined as any }));
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                  {formErrors.price_from && <Text style={styles.fieldError}>{formErrors.price_from}</Text>}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.createEventButton} onPress={handleCreate}>
              <Text style={styles.createEventButtonText}>Create Event</Text>
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
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lastSection: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  noMarginBottom: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  dateSeparator: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  googleInput: {
    backgroundColor: 'transparent',
    fontSize: 15,
    color: '#1A1A1A',
    paddingHorizontal: 0,
    paddingVertical: 0,
    height: 24,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  pillActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  bookingToggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
    marginTop: 8,
  },
  bookingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  bookingOptionActive: {
    backgroundColor: '#FF6B35',
  },
  bookingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  bookingOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createEventButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  autoPopulatedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  autoPopulatedLabel: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  autoPopulatedValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  dateError: {
    fontSize: 13,
    color: '#DC3545',
    marginTop: 10,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 6,
    fontWeight: '500',
  },
  galleryGrid: {
    gap: 12,
  },
});
