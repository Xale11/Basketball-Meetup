import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { MapPin, Users, Globe, Lock, Clock, Building, X, Coins } from 'lucide-react-native';
import {
  GooglePlacesAutocomplete,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';
import { useGooglePlacesRequest } from '@/hooks/useGooglePlacesRequest';
import {
  CreateEventForm,
  EventBookingMode,
  EventCategory,
  EventHostType,
  EventJoinPolicy,
  EventVisibility,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
} from '@/types/event';
import { useCreateEvent } from '@/hooks/events/useCreateEvent';
import { useFetchUserSocieties } from '@/hooks/societies/useFetchUserSocieties';
import { useAuth } from '@/hooks/useAuth';
import DateTimeInput from '@/components/DateTimeInput';
import { ImagePicker } from '@/components/ImagePicker';
import { OptionCardList } from '@/components/ui/OptionCard';
import { PillSelector } from '@/components/ui/PillSelector';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

/** A tag is a short free-text label; the row is capped to keep cards readable. */
const MAX_TAGS = 5;

const VISIBILITY_OPTIONS = [
  { label: 'Public',          description: 'Everyone can see this',     value: EventVisibility.PUBLIC,          icon: Globe },
  { label: 'Society Only',    description: 'Society members only',      value: EventVisibility.SOCIETY_ONLY,    icon: Users },
  { label: 'University Only', description: 'Your university only',      value: EventVisibility.UNIVERSITY_ONLY, icon: Building },
  { label: 'Private',         description: 'Hidden from discovery',     value: EventVisibility.PRIVATE,         icon: Lock },
];

const JOIN_POLICY_OPTIONS = [
  { label: 'Open',        description: 'Anyone can join instantly', value: EventJoinPolicy.OPEN,              icon: Globe },
  { label: 'Approval',    description: 'You approve each request',  value: EventJoinPolicy.APPROVAL_REQUIRED, icon: Clock },
  { label: 'Invite Only', description: 'By invitation only',        value: EventJoinPolicy.INVITE_ONLY,       icon: Lock },
];

const HOST_TYPE_OPTIONS = [
  { label: 'Personal',   description: 'Just you',                     value: EventHostType.USER,       icon: Users },
  { label: 'Society',    description: 'On behalf of a society',       value: EventHostType.SOCIETY,    icon: Users },
  { label: 'University', description: 'On behalf of your university', value: EventHostType.UNIVERSITY, icon: Building },
];

const INITIAL_FORM: CreateEventForm = {
  name: '',
  description: null,
  category: null,
  tags: [],
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

/** Formats the gap between start and end as the redesign's duration hint. */
function durationLabel(start: string, end: string): string | null {
  if (!start || !end) return null;
  const minutes = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  if (minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

export default function CreateScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { colors } = theme;

  const [form, setForm] = useState<CreateEventForm>(INITIAL_FORM);
  const [tagDraft, setTagDraft] = useState('');
  const [hasMaxParticipants, setHasMaxParticipants] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { user } = useAuth();
  const placesRequest = useGooglePlacesRequest();
  const { memberships } = useFetchUserSocieties(user?.id);
  const { createEvent, loading } = useCreateEvent();

  const needsSociety =
    form.host_type === EventHostType.SOCIETY ||
    form.visibility === EventVisibility.SOCIETY_ONLY;

  const isPaid = form.booking_mode === EventBookingMode.TICKETED;
  const duration = durationLabel(form.start_date, form.end_date);

  /** Clears one field's error without disturbing the others. */
  const clearError = (key: string) =>
    setFormErrors(({ [key]: _removed, ...rest }) => rest);

  /** Trims, dedupes case-insensitively and enforces the cap. */
  const addTag = () => {
    const tag = tagDraft.trim();
    if (!tag) return;
    setForm((p) => {
      if (p.tags.length >= MAX_TAGS) return p;
      if (p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return p;
      return { ...p, tags: [...p.tags, tag] };
    });
    setTagDraft('');
  };

  const removeTag = (tag: string) =>
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

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
    clearError('address');
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
    if (isPaid && (form.price_from == null || form.price_from <= 0)) {
      errors.price_from = 'Enter a ticket price above £0.';
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
          Alert.alert('Created!', 'Your activity is live.', [
            { text: 'Done', onPress: () => router.back() },
          ]);
        },
        onError: (err) => Alert.alert('Error', err.message),
      },
    );
  };

  // `societies.name` is nullable in the schema; the pill selector needs a string.
  const societyPillOptions = memberships.map((m) => ({
    label: m.societies.name ?? 'Untitled society',
    value: m.society_id,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal chrome — this is a presented sheet, so it needs its own dismiss. */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Host an activity</Text>
          <Text style={styles.subtitle}>Bring people together on campus</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What's happening? *</Text>
          <TextInputField
            value={form.name}
            onChangeText={(val) => {
              setForm((p) => ({ ...p, name: val }));
              if (val.trim()) clearError('name');
            }}
            placeholder="e.g. 5-a-side football, study session..."
            maxLength={80}
            error={formErrors.name}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInputField
            value={form.description ?? ''}
            onChangeText={(val) => setForm((p) => ({ ...p, description: val || null }))}
            placeholder="Tell people what this activity is about..."
            multiline
            numberOfLines={3}
            multilineHeight={90}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <Text style={styles.sectionSubLabel}>Helps people find this in Discover</Text>
          <View style={styles.chipWrap}>
            {EVENT_CATEGORIES.map((cat) => {
              const active = form.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setForm((p) => ({ ...p, category: active ? null : (cat as EventCategory) }))
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {EVENT_CATEGORY_LABEL[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags</Text>
          <Text style={styles.sectionSubLabel}>
            Up to {MAX_TAGS} short labels, e.g. “Beginners”, “Casual”
          </Text>

          {form.tags.length > 0 && (
            <View style={styles.chipWrap}>
              {form.tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, styles.chipActive]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.chipText, styles.chipTextActive]}>{tag}</Text>
                  <X size={11} color={theme.colors.accentTone.text} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {form.tags.length < MAX_TAGS && (
            <TextInputField
              value={tagDraft}
              onChangeText={setTagDraft}
              placeholder="Add a tag and press enter"
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={addTag}
              blurOnSubmit={false}
              style={styles.tagField}
            />
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>When? *</Text>
            {duration && (
              <View style={styles.durationPill}>
                <Clock size={11} color={colors.accentTone.text} />
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            )}
          </View>
          <View style={styles.dateTimeRow}>
            <DateTimeInput
              label="Start"
              defaultValue="Select start"
              initialValue={form.start_date || undefined}
              onChange={(val) => {
                setForm((p) => {
                  const newEnd = p.end_date && p.end_date <= val ? '' : p.end_date;
                  if (p.end_date && p.end_date <= val) {
                    setDateError('End time must be after start time.');
                  } else {
                    setDateError(null);
                  }
                  return { ...p, start_date: val, end_date: newEnd };
                });
                clearError('start_date');
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
                clearError('end_date');
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
                trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                thumbColor={colors.textPrimary}
              />
            </View>
          </View>
          {!form.is_online && (
            <View
              style={[
                styles.addressInputWrapper,
                formErrors.address ? styles.addressInputError : null,
              ]}
            >
              <MapPin size={18} color={colors.textMuted} style={styles.addressIcon} />
              <GooglePlacesAutocomplete
                placeholder="Search for a venue or address"
                debounce={300}
                fetchDetails={true}
                {...placesRequest}
                textInputProps={{ placeholderTextColor: colors.textFaint }}
                query={{ language: 'en' }}
                onPress={(_, details) => addLocationToForm(details ?? null)}
                enablePoweredByContainer={false}
                styles={{
                  textInput: styles.googleInput,
                  container: styles.googleContainer,
                  listView: styles.googleListView,
                  row: styles.googleRow,
                  description: styles.googleDescription,
                  separator: styles.googleSeparator,
                }}
              />
            </View>
          )}
          {formErrors.address && <Text style={styles.fieldError}>{formErrors.address}</Text>}
        </View>

        {/* Cost */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cost</Text>
          <Text style={styles.sectionSubLabel}>Is this free to attend?</Text>
          <SegmentedTabs
            tabs={[
              { key: EventBookingMode.FREE, label: 'Free' },
              { key: EventBookingMode.TICKETED, label: 'Paid' },
            ]}
            activeTab={form.booking_mode ?? EventBookingMode.FREE}
            onTabChange={(mode) =>
              setForm((p) => ({
                ...p,
                booking_mode: mode,
                // Currency is only meaningful alongside a price.
                price_from: mode === EventBookingMode.FREE ? null : p.price_from,
                currency: mode === EventBookingMode.FREE ? null : (p.currency ?? 'GBP'),
              }))
            }
          />

          {isPaid && (
            <View style={styles.subSection}>
              <TextInputField
                icon={Coins}
                value={form.price_from != null ? String(form.price_from) : ''}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9.]/g, '');
                  const parsed = cleaned === '' ? null : Number(cleaned);
                  setForm((p) => ({
                    ...p,
                    price_from: parsed != null && Number.isFinite(parsed) ? parsed : null,
                    currency: p.currency ?? 'GBP',
                  }));
                  clearError('price_from');
                }}
                placeholder="Ticket price in £"
                keyboardType="decimal-pad"
                error={formErrors.price_from}
              />
            </View>
          )}
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visibility</Text>
          <Text style={styles.sectionSubLabel}>Who can see this activity?</Text>
          <OptionCardList
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
          <Text style={styles.sectionLabel}>Who can join?</Text>
          <Text style={styles.sectionSubLabel}>How do people get in?</Text>
          <OptionCardList
            options={JOIN_POLICY_OPTIONS}
            selected={form.join_policy}
            onSelect={(value) => setForm((p) => ({ ...p, join_policy: value }))}
          />
        </View>

        {/* Host Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hosted by</Text>
          <Text style={styles.sectionSubLabel}>Who is organising this activity?</Text>
          <OptionCardList
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
              <Text style={styles.subSectionLabel}>Which society?</Text>
              <PillSelector
                options={societyPillOptions}
                selected={form.society_id ?? ''}
                onSelect={(value) => {
                  setForm((p) => ({ ...p, society_id: value }));
                  clearError('society_id');
                }}
              />
              {formErrors.society_id && (
                <Text style={styles.fieldError}>{formErrors.society_id}</Text>
              )}
            </View>
          )}

          {needsSociety && memberships.length === 1 && (
            <View style={styles.autoPopulatedTag}>
              <Text style={styles.autoPopulatedLabel}>Society</Text>
              <Text style={styles.autoPopulatedValue}>
                {memberships[0].societies.name ?? 'Untitled society'}
              </Text>
            </View>
          )}

          {needsSociety && memberships.length === 0 && (
            <Text style={styles.sectionNote}>You're not a member of any society yet.</Text>
          )}
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelStack}>
              <Text style={styles.sectionLabel}>Max participants</Text>
              <Text style={styles.sectionSubLabel}>Leave off for unlimited</Text>
            </View>
            <Switch
              value={hasMaxParticipants}
              onValueChange={(val) => {
                setHasMaxParticipants(val);
                setForm((p) => ({ ...p, max_participants: val ? 10 : null }));
              }}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.textPrimary}
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
                <Users size={16} color={colors.textMuted} />
                <Text style={styles.counterValue}>{form.max_participants ?? 10}</Text>
              </View>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  setForm((p) => ({ ...p, max_participants: (p.max_participants ?? 10) + 1 }))
                }
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Banner Image */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Banner image</Text>
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
        <Button label="Publish activity" onPress={handleCreate} loading={loading} />
      </View>
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

    content: { flex: 1, paddingHorizontal: t.spacing.lg },
    section: { marginTop: t.spacing.xl },
    sectionLabel: { ...t.typography.h3, color: t.colors.textPrimary, marginBottom: 4 },
    sectionSubLabel: { ...t.typography.caption, color: t.colors.textMuted, marginBottom: 10 },
    sectionNote: { ...t.typography.caption, color: t.colors.textMuted, marginTop: t.spacing.sm },
    sectionLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionLabelStack: { flex: 1 },

    durationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: t.spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
    },
    durationText: { ...t.typography.badge, fontSize: 10, color: t.colors.accentTone.text },

    onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    onlineToggleLabel: { ...t.typography.caption, color: t.colors.textMuted },
    fieldError: { ...t.typography.caption, color: t.colors.dangerTone.text, marginTop: 4 },
    dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    dateSeparator: { ...t.typography.caption, color: t.colors.textMuted, marginTop: 18 },

    addressInputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.chip,
      paddingHorizontal: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      gap: t.spacing.sm,
    },
    addressInputError: { borderColor: t.colors.dangerTone.solid },
    addressIcon: { marginTop: 14 },
    googleContainer: { flex: 1 },
    googleInput: {
      backgroundColor: 'transparent',
      fontFamily: t.typography.body.fontFamily,
      fontSize: 15,
      color: t.colors.textPrimary,
      paddingHorizontal: 0,
      height: 48,
    },
    // The dropdown renders outside our wrapper, so it needs its own surface.
    googleListView: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    googleRow: { backgroundColor: 'transparent', paddingVertical: t.spacing.md },
    googleDescription: {
      fontFamily: t.typography.body.fontFamily,
      fontSize: 14,
      color: t.colors.textBody,
    },
    googleSeparator: { height: 1, backgroundColor: t.colors.border },

    // Category and tag chips (AC-21).
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 7,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    chipActive: {
      backgroundColor: t.colors.accentTone.bg,
      borderColor: t.colors.accentTone.border,
    },
    chipText: { ...t.typography.badge, fontSize: 12, color: t.colors.textMuted },
    chipTextActive: { color: t.colors.accentTone.text },
    tagField: { marginTop: t.spacing.sm },

    subSection: { marginTop: t.spacing.lg },
    subSectionLabel: { ...t.typography.label, color: t.colors.textMuted, marginBottom: t.spacing.sm },
    autoPopulatedTag: {
      marginTop: t.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
      borderRadius: t.radius.sm,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      alignSelf: 'flex-start',
    },
    autoPopulatedLabel: { ...t.typography.microLabel, fontSize: 10, color: t.colors.accentText },
    autoPopulatedValue: { ...t.typography.bodyStrong, color: t.colors.textPrimary },

    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.lg,
      marginTop: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.chip,
      padding: t.spacing.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    counterButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    counterButtonText: { ...t.typography.h2, color: t.colors.textPrimary },
    counterValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      minWidth: 60,
      justifyContent: 'center',
    },
    counterValue: { ...t.typography.h2, color: t.colors.textPrimary },

    bottomPadding: { height: t.spacing.xxl },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      backgroundColor: t.colors.surface,
      borderTopWidth: 1,
      borderTopColor: t.colors.chromeBorder,
    },
  });
