import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { MapPin, Users, Globe, Lock, Clock, Building } from 'lucide-react-native';
import {
  GooglePlacesAutocomplete,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import {
  CreateEventForm,
  EventBookingMode,
  EventHostType,
  EventJoinPolicy,
  EventVisibility,
} from '@/types/event';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useFetchUniversityMembership } from '@/hooks/universities/useFetchUniversityMembership';
import { useAuth } from '@/hooks/useAuth';
import { UniversityRole } from '@/types/universities';
import DateTimeInput from '@/components/DateTimeInput';
import { ImagePicker } from '@/components/ImagePicker';

const VISIBILITY_OPTIONS: { label: string; description: string; value: EventVisibility; icon: typeof Globe }[] = [
  { label: 'Public',          description: 'Everyone can see this',        value: EventVisibility.PUBLIC,          icon: Globe },
  { label: 'Society Only',    description: 'Society members only',         value: EventVisibility.SOCIETY_ONLY,    icon: Users },
  { label: 'University Only', description: 'Your university only',         value: EventVisibility.UNIVERSITY_ONLY, icon: Building },
  { label: 'Private',         description: 'Hidden from discovery',        value: EventVisibility.PRIVATE,         icon: Lock },
];

const JOIN_POLICY_OPTIONS: { label: string; description: string; value: EventJoinPolicy; icon: typeof Globe }[] = [
  { label: 'Open',             description: 'Anyone can join instantly',    value: EventJoinPolicy.OPEN,              icon: Globe },
  { label: 'Approval',         description: 'You approve each request',    value: EventJoinPolicy.APPROVAL_REQUIRED, icon: Clock },
  { label: 'Invite Only',      description: 'By invitation only',          value: EventJoinPolicy.INVITE_ONLY,       icon: Lock },
];

const HOST_TYPE_OPTIONS: { label: string; description: string; value: EventHostType; icon: typeof Globe }[] = [
  { label: 'Personal',    description: 'Just you',                         value: EventHostType.USER,       icon: Users },
  { label: 'Society',     description: 'On behalf of a society',           value: EventHostType.SOCIETY,    icon: Users },
  { label: 'University',  description: 'On behalf of your university',     value: EventHostType.UNIVERSITY, icon: Building },
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

export default function CreateScreen() {
  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  const [hasMaxParticipants, setHasMaxParticipants] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const { memberships } = useFetchUserSocieties(user?.id);
  const { membership: uniMembership } = useFetchUniversityMembership(user?.id);
  const { createEvent, loading } = useCreateEvent();

  const isUniAdmin = uniMembership?.role === UniversityRole.ADMIN;

  const needsSociety =
    form.host_type === EventHostType.SOCIETY ||
    form.visibility === EventVisibility.SOCIETY_ONLY;

  const addLocationToForm = (details: GooglePlaceDetail | null) => {
    if (!details) return;
    const lat = details.geometry.location.lat ?? details.geometry.location.latitude;
    const lng = details.geometry.location.lng ?? details.geometry.location.longitude;
    if (!lat || !lng) {
      Alert.alert('Error', 'Could not read location coordinates. Please try again.');
      return;
    }
    setForm((p) => ({
      ...p,
      address: details.formatted_address ?? details.formattedAddress ?? null,
      latitude: lat,
      longitude: lng,
    }));
    setFormErrors((e) => ({ ...e, address: undefined as any }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Activity name is required.';
    if (!form.start_date) errors.start_date = 'Start time is required.';
    if (!form.end_date) errors.end_date = 'End time is required.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      errors.end_date = 'End time must be after start time.';
    }
    if (!form.is_online && !form.address) errors.address = 'Location is required.';
    if (needsSociety && memberships.length > 0 && !form.society_id) {
      errors.society_id = 'Please select a society.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    createEvent(
      { ...form, university_id: user?.university_id ?? null },
      {
        onSuccess: () => {
          setForm(INITIAL_FORM);
          setHasMaxParticipants(false);
          setFormErrors({});
          Alert.alert('Created!', 'Your activity is live.');
        },
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Activity</Text>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What's happening? *</Text>
          <TextInput
            style={[styles.input, formErrors.name ? styles.inputError : null]}
            value={form.name}
            onChangeText={(val) => {
              setForm((p) => ({ ...p, name: val }));
              if (val.trim()) setFormErrors((e) => ({ ...e, name: undefined as any }));
            }}
            placeholder="e.g. 5-a-side football, study session..."
            placeholderTextColor="#999"
            maxLength={80}
          />
          {formErrors.name && <Text style={styles.fieldError}>{formErrors.name}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description ?? ''}
            onChangeText={(val) => setForm((p) => ({ ...p, description: val || null }))}
            placeholder="Tell people what this activity is about..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>When? *</Text>
          <View style={styles.dateTimeRow}>
            <DateTimeInput
              label="Start"
              defaultValue="Select start"
              initialValue={form.start_date || undefined}
              onChange={(val) => {
                setForm((p) => {
                  const newEnd = p.end_date && p.end_date <= val ? '' : p.end_date;
                  if (p.end_date && p.end_date <= val) setDateError('End time must be after start time.');
                  else setDateError(null);
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
              initialValue={form.end_date || undefined}
              onChange={(val) => {
                if (form.start_date && val <= form.start_date) {
                  setDateError('End time must be after start time.');
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
            <Text style={styles.fieldError}>
              {dateError || formErrors.start_date || formErrors.end_date}
            </Text>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Where? {form.is_online ? '' : '*'}</Text>
            <View style={styles.onlineToggle}>
              <Text style={styles.onlineToggleLabel}>Online</Text>
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
          </View>
          {!form.is_online && (
            <View style={[styles.addressInputWrapper, formErrors.address ? styles.inputError : null]}>
              <MapPin size={18} color="#666" style={{ marginTop: 14 }} />
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
                onPress={(_, details) => addLocationToForm(details ?? null)}
                enablePoweredByContainer={false}
                styles={{
                  textInput: styles.googleInput,
                  container: { flex: 1 },
                  listView: { backgroundColor: '#FFFFFF', borderRadius: 8 },
                }}
              />
            </View>
          )}
          {formErrors.address && <Text style={styles.fieldError}>{formErrors.address}</Text>}
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visibility</Text>
          <Text style={styles.sectionSubLabel}>Who can see this activity?</Text>
          <View style={styles.optionList}>
            {VISIBILITY_OPTIONS.map(({ label, description, value, icon: Icon }) => {
              const active = form.visibility === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => {
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
                >
                  <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                    <Icon size={20} color={active ? '#FFFFFF' : '#666'} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
                    <Text style={styles.optionDescription}>{description}</Text>
                  </View>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Join Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Who Can Join?</Text>
          <Text style={styles.sectionSubLabel}>How do people get in?</Text>
          <View style={styles.optionList}>
            {JOIN_POLICY_OPTIONS.map(({ label, description, value, icon: Icon }) => {
              const active = form.join_policy === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setForm((p) => ({ ...p, join_policy: value }))}
                >
                  <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                    <Icon size={20} color={active ? '#FFFFFF' : '#666'} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
                    <Text style={styles.optionDescription}>{description}</Text>
                  </View>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Host Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hosted By</Text>
          <Text style={styles.sectionSubLabel}>Who is organising this activity?</Text>
          <View style={styles.optionList}>
            {HOST_TYPE_OPTIONS.map(({ label, description, value, icon: Icon }) => {
              const active = form.host_type === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => {
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
                >
                  <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                    <Icon size={20} color={active ? '#FFFFFF' : '#666'} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
                    <Text style={styles.optionDescription}>{description}</Text>
                  </View>
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {needsSociety && memberships.length > 1 && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionLabel}>Which society?</Text>
              <View style={styles.chipRow}>
                {memberships.map((m) => (
                  <TouchableOpacity
                    key={m.society_id}
                    style={[styles.chip, form.society_id === m.society_id && styles.chipActive]}
                    onPress={() => {
                      setForm((p) => ({ ...p, society_id: m.society_id }));
                      setFormErrors((e) => ({ ...e, society_id: undefined as any }));
                    }}
                  >
                    <Text style={[styles.chipText, form.society_id === m.society_id && styles.chipTextActive]}>
                      {m.societies.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.society_id && <Text style={styles.fieldError}>{formErrors.society_id}</Text>}
            </View>
          )}

          {needsSociety && memberships.length === 1 && (
            <View style={styles.autoPopulatedTag}>
              <Text style={styles.autoPopulatedLabel}>Society</Text>
              <Text style={styles.autoPopulatedValue}>{memberships[0].societies.name}</Text>
            </View>
          )}

          {needsSociety && memberships.length === 0 && (
            <Text style={[styles.sectionSubLabel, { marginTop: 8 }]}>
              You're not a member of any society yet.
            </Text>
          )}
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View>
              <Text style={styles.sectionLabel}>Max Participants</Text>
              <Text style={styles.sectionSubLabel}>Leave off for unlimited</Text>
            </View>
            <Switch
              value={hasMaxParticipants}
              onValueChange={(val) => {
                setHasMaxParticipants(val);
                if (!val) setForm((p) => ({ ...p, max_participants: null }));
                else setForm((p) => ({ ...p, max_participants: 10 }));
              }}
              trackColor={{ true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
          {hasMaxParticipants && (
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  setForm((p) => ({
                    ...p,
                    max_participants: Math.max(2, (p.max_participants ?? 10) - 1),
                  }))
                }
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.counterValueContainer}>
                <Users size={16} color="#666" />
                <Text style={styles.counterValue}>{form.max_participants ?? 10}</Text>
              </View>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  setForm((p) => ({
                    ...p,
                    max_participants: (p.max_participants ?? 10) + 1,
                  }))
                }
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Banner Image */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Banner Image</Text>
          <ImagePicker
            placeholder="Add a banner photo"
            selectedImage={form.banner_image_uri ?? form.banner_image_url ?? undefined}
            onImageSelected={(uri) => setForm((p) => ({ ...p, banner_image_uri: uri }))}
            onImageRemoved={() => setForm((p) => ({ ...p, banner_image_uri: null }))}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating…' : 'Create Activity'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  sectionSubLabel: { fontSize: 13, color: '#888', marginBottom: 10 },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineToggleLabel: { fontSize: 14, color: '#666' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputError: { borderColor: '#DC3545' },
  textArea: { height: 90, textAlignVertical: 'top' },
  fieldError: { fontSize: 13, color: '#DC3545', marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#666' },
  chipTextActive: { color: '#FFFFFF' },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateSeparator: { fontSize: 14, color: '#888' },
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  googleInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#1A1A1A',
    paddingHorizontal: 0,
    height: 48,
  },
  optionList: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 12,
  },
  optionCardActive: { borderColor: '#FF6B35', backgroundColor: '#FFF4F0' },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconActive: { backgroundColor: '#FF6B35' },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  optionLabelActive: { color: '#FF6B35' },
  optionDescription: { fontSize: 13, color: '#888', marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: { borderColor: '#FF6B35' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
  subSection: { marginTop: 16 },
  subSectionLabel: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
  autoPopulatedTag: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF4F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  autoPopulatedLabel: { fontSize: 13, color: '#FF6B35', fontWeight: '600' },
  autoPopulatedValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: { fontSize: 20, color: '#1A1A1A', fontWeight: '600' },
  counterValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  counterValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  bottomPadding: { height: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
