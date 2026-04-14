import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react-native';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import {
  CreateEventForm,
  Event,
  EventBookingMode,
  EventHostType,
  EventJoinPolicy,
  EventVisibility,
} from '@/types/event';
import { SocietyMembershipWithSociety } from '@/api/societies.api';
import { User } from '@/types/user';
import DateTimeInput from '@/components/DateTimeInput';
import { ImagePicker } from '@/components/ImagePicker';
import { PillSelector } from '@/components/ui/PillSelector';

const VISIBILITY_OPTIONS = [
  { label: 'Public', value: EventVisibility.PUBLIC },
  { label: 'Society Only', value: EventVisibility.SOCIETY_ONLY },
  { label: 'University Only', value: EventVisibility.UNIVERSITY_ONLY },
  { label: 'Private', value: EventVisibility.PRIVATE },
];

const JOIN_POLICY_OPTIONS = [
  { label: 'Open', value: EventJoinPolicy.OPEN },
  { label: 'Approval Required', value: EventJoinPolicy.APPROVAL_REQUIRED },
  { label: 'Invite Only', value: EventJoinPolicy.INVITE_ONLY },
];

const HOST_TYPE_OPTIONS = [
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

interface EventFormModalProps {
  visible: boolean;
  editingEvent: Event | null;
  memberships: SocietyMembershipWithSociety[];
  user: User | null;
  onClose: () => void;
  onSubmit: (form: CreateEventForm) => void;
  loading?: boolean;
}

export function EventFormModal({
  visible,
  editingEvent,
  memberships,
  user,
  onClose,
  onSubmit,
  loading,
}: EventFormModalProps) {
  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  const [dateError, setDateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingEvent) {
      setForm({
        name: editingEvent.name,
        description: editingEvent.description,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        is_online: editingEvent.is_online,
        address: editingEvent.address,
        latitude: editingEvent.latitude,
        longitude: editingEvent.longitude,
        visibility: editingEvent.visibility,
        join_policy: editingEvent.join_policy,
        max_participants: editingEvent.max_participants,
        host_type: editingEvent.host_type,
        society_id: editingEvent.society_id,
        university_id: editingEvent.university_id,
        banner_image_url: editingEvent.banner_image_url,
        banner_image_uri: null,
        gallery_image_uris: [],
        booking_mode: editingEvent.booking_mode,
        price_from: editingEvent.price_from,
        currency: editingEvent.currency,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setDateError(null);
    setFormErrors({});
  }, [editingEvent, visible]);

  const needsSociety =
    form.host_type === EventHostType.SOCIETY ||
    form.visibility === EventVisibility.SOCIETY_ONLY;

  const validate = (): boolean => {
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

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, university_id: user?.university_id ?? null });
  };

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

  const societyPillOptions = memberships.map((m) => ({
    label: m.societies.name,
    value: m.society_id,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{editingEvent ? 'Edit Event' : 'Create Event'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Name *</Text>
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

            <View style={styles.inputGroupNoMargin}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description ?? ''}
                onChangeText={(val) => setForm((p) => ({ ...p, description: val || null }))}
                placeholder="Tell people what this event is about..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.dateTimeRow} key={editingEvent?.id ?? 'new'}>
              <DateTimeInput
                label="Start"
                defaultValue="Select start"
                initialValue={form.start_date || undefined}
                onChange={(val) => {
                  setForm((p) => {
                    const newEnd = p.end_date && p.end_date <= val ? '' : p.end_date;
                    if (p.end_date && p.end_date <= val) setDateError('End date must be after the start date.');
                    else setDateError(null);
                    return { ...p, start_date: val, end_date: newEnd };
                  });
                  setFormErrors((e) => ({ ...e, start_date: undefined as any }));
                  return true;
                }}
              />
              <Text style={styles.separator}>to</Text>
              <DateTimeInput
                label="End"
                defaultValue="Select end"
                initialValue={form.end_date || undefined}
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Online event</Text>
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
              <View style={styles.inputGroupNoMargin}>
                <Text style={styles.label}>Address *</Text>
                <View style={[styles.addressWrapper, formErrors.address ? styles.inputError : null]}>
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
                      addLocationToForm(details ?? null);
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <Text style={styles.sectionSubtitle}>Who can see this event?</Text>
            <PillSelector
              options={VISIBILITY_OPTIONS}
              selected={form.visibility}
              onSelect={(value) => {
                const newNeedsSociety =
                  form.host_type === EventHostType.SOCIETY ||
                  value === EventVisibility.SOCIETY_ONLY;
                setForm((p) => ({
                  ...p,
                  visibility: value,
                  university_id: user?.university_id ?? null,
                  society_id: newNeedsSociety ? (memberships[0]?.society_id ?? null) : null,
                }));
              }}
            />
          </View>

          {/* Join Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who Can Join</Text>
            <Text style={styles.sectionSubtitle}>How do people get in?</Text>
            <PillSelector
              options={JOIN_POLICY_OPTIONS}
              selected={form.join_policy}
              onSelect={(value) => setForm((p) => ({ ...p, join_policy: value }))}
            />
          </View>

          {/* Host Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted By</Text>
            <Text style={styles.sectionSubtitle}>Who is organising this event?</Text>
            <PillSelector
              options={HOST_TYPE_OPTIONS}
              selected={form.host_type}
              onSelect={(value) => {
                const newNeedsSociety =
                  value === EventHostType.SOCIETY ||
                  form.visibility === EventVisibility.SOCIETY_ONLY;
                setForm((p) => ({
                  ...p,
                  host_type: value,
                  university_id: user?.university_id ?? null,
                  society_id: newNeedsSociety ? (memberships[0]?.society_id ?? null) : null,
                }));
              }}
            />

            {needsSociety && memberships.length > 1 && (
              <View style={styles.subSection}>
                <Text style={styles.label}>Which society?</Text>
                <PillSelector
                  options={societyPillOptions}
                  selected={form.society_id ?? ''}
                  onSelect={(value) => {
                    setForm((p) => ({ ...p, society_id: value }));
                    setFormErrors((e) => ({ ...e, society_id: undefined as any }));
                  }}
                />
                {formErrors.society_id && <Text style={styles.fieldError}>{formErrors.society_id}</Text>}
              </View>
            )}

            {needsSociety && memberships.length === 1 && (
              <View style={styles.autoTag}>
                <Text style={styles.autoTagLabel}>Society</Text>
                <Text style={styles.autoTagValue}>{memberships[0].societies.name}</Text>
              </View>
            )}

            {needsSociety && memberships.length === 0 && (
              <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>
                You're not a member of any society yet.
              </Text>
            )}
          </View>

          {/* Capacity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            <View style={styles.inputGroupNoMargin}>
              <Text style={styles.label}>Max Participants</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Banner Image</Text>
              <ImagePicker
                placeholder="Add Banner Image"
                selectedImage={form.banner_image_uri ?? form.banner_image_url ?? undefined}
                onImageSelected={(uri) => setForm((p) => ({ ...p, banner_image_uri: uri }))}
                onImageRemoved={() => setForm((p) => ({ ...p, banner_image_uri: null }))}
              />
            </View>

            <View style={styles.inputGroupNoMargin}>
              <Text style={styles.label}>Gallery Photos</Text>
              <Text style={styles.sectionSubtitle}>Add extra photos for the event.</Text>
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
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Booking</Text>

            <View style={styles.bookingToggle}>
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
                    form.booking_mode === EventBookingMode.TICKETED && styles.bookingOptionTextActive,
                  ]}
                >
                  Ticketed
                </Text>
              </TouchableOpacity>
            </View>

            {form.booking_mode === EventBookingMode.TICKETED && (
              <View style={[styles.inputGroup, { marginTop: 16 }]}>
                <Text style={styles.label}>Starting Price *</Text>
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

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving…' : editingEvent ? 'Save Changes' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  cancelButton: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: {
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
  lastSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#888', marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 8 },
  inputGroup: { marginBottom: 16 },
  inputGroupNoMargin: { marginBottom: 0 },
  subSection: { marginTop: 16 },
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
  inputError: { borderColor: '#DC3545' },
  textArea: { height: 100, textAlignVertical: 'top' },
  fieldError: { fontSize: 13, color: '#DC3545', marginTop: 4 },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  separator: { fontSize: 13, color: '#888', fontWeight: '500' },
  dateError: { fontSize: 13, color: '#DC3545', marginTop: 10, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressWrapper: {
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
  autoTag: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  autoTagLabel: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
  autoTagValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bookingToggle: {
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
  bookingOptionActive: { backgroundColor: '#FF6B35' },
  bookingOptionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  bookingOptionTextActive: { color: '#FFFFFF' },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
