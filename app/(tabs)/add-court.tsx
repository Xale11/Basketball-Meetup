import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, X, Clock } from 'lucide-react-native';
import { ImagePicker } from '@/components/ImagePicker';
import { useAuth } from '@/hooks/useAuth';
import { CreateCourtForm, OpeningHours } from '@/types/courts';
import TimeInput from '@/components/TimeInput';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import ngeohash from 'ngeohash';

export default function AddCourtScreen() {
  const {} = useAuth();

  const [form, setForm] = useState<CreateCourtForm>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    geohash: '',
    description: '',
    images: [],
    tags: [],
    openingHours: {
      alwaysOpen: false,
      monday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      tuesday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      wednesday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      thursday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      friday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      saturday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
      sunday: { alwaysOpen: false, openTime: '09:00', closeTime: '21:00' },
    },
    createdBy: '',
  });

  const [newTag, setNewTag] = useState('');

  const commonTags = [
    'Outdoor Court',
    'Indoor Court',
    'Full Court',
    'Half Court',
    'Lighting',
    'Free Parking',
    'Restrooms',
    'Water Fountain',
    'Seating',
    'Scoreboard',
  ];

  const handleAddImage = (uri: string) => {
    setForm((prev) => ({ ...prev, images: [...prev.images, uri] }));
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = (tag: string) => {
    if (!form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((a) => a !== tag) }));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const updateDayHours = (
    day: keyof Omit<OpeningHours, 'alwaysOpen'>,
    field: 'alwaysOpen' | 'openTime' | 'closeTime',
    value: boolean | string
  ) => {
    if (
      (field === 'openTime' && value > form.openingHours[day].closeTime) ||
      (field === 'closeTime' && value < form.openingHours[day].openTime)
    ) {
      Alert.alert('Error', 'Open time must be before close time');
      return false;
    } else {
      setForm((prev) => ({
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [day]: {
            ...prev.openingHours[day],
            [field]: value,
          },
        },
      }));
      return true;
    }
  };

  const updateGlobalAlwaysOpen = (value: boolean) => {
    setForm((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        alwaysOpen: value,
        monday: { ...prev.openingHours.monday, alwaysOpen: value },
        tuesday: { ...prev.openingHours.tuesday, alwaysOpen: value },
        wednesday: { ...prev.openingHours.wednesday, alwaysOpen: value },
        thursday: { ...prev.openingHours.thursday, alwaysOpen: value },
        friday: { ...prev.openingHours.friday, alwaysOpen: value },
        saturday: { ...prev.openingHours.saturday, alwaysOpen: value },
        sunday: { ...prev.openingHours.sunday, alwaysOpen: value },
      },
    }));
  };

  const addLocationToForm = (loc: GooglePlaceDetail | null) => {
    if (!loc || !loc?.geometry.location.longitude || !loc?.geometry.location.latitude) {
      Alert.alert(
        'Error',
        'There was an error setting the location. Please try again.'
      );
      return
    } else {
      setForm((prev) => ({
        ...prev,
        longitude: loc?.geometry.location.longitude,
        latitude: loc?.geometry.location.latitude,
        geohash: ngeohash.encode(51.5074, -0.1278, 9)
      }));
    }
    
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.address.trim()) {
      Alert.alert('Error', 'Please fill in court name and address');
      return;
    }

    // Here you would typically save to your backend
    Alert.alert('Success', 'Court added successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Court</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Court Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(val) =>
                setForm((prev) => ({ ...prev, name: val }))
              }
              placeholder="e.g., Central Park Basketball Court"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.addressInput}>
              <MapPin size={20} color="#666" />
              {/* <TextInput
                style={styles.addressTextInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter court address"
                placeholderTextColor="#999"
                multiline
              /> */}
              <GooglePlacesAutocomplete
                placeholder="Search for a court"
                debounce={300}
                fetchDetails={true}
                query={{
                  key:
                    Constants.expoConfig?.extra?.googleMapsApiKey ||
                    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                  language: 'en',
                  type: 'establishment',
                }}
                onPress={(data, details) => {
                  if (details?.geometry?.location) {
                    setForm((prev) => ({
                      ...prev,
                      address:
                        details?.formatted_address || data.description || '',
                      latitude: details.geometry.location.lat,
                      longitude: details.geometry.location.lng,
                      geohash: ngeohash.encode(51.5074, -0.1278, 9)
                    }));
                  }
                }}
                enablePoweredByContainer={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(val) =>
                setForm((prev) => ({ ...prev, description: val }))
              }
              placeholder="Tell players about this court..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Add photos to help players find and recognize the court
          </Text>

          {form.images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <ImagePicker
                selectedImage={image}
                onImageSelected={() => {}}
                onImageRemoved={() => handleRemoveImage(index)}
                placeholder="Court Photo"
              />
            </View>
          ))}

          {form.images.length < 5 && (
            <ImagePicker
              onImageSelected={handleAddImage}
              placeholder={
                form.images.length === 0
                  ? 'Add First Photo'
                  : 'Add Another Photo'
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.sectionSubtitle}>
            Select all tags available at this court
          </Text>

          <View style={styles.tagsGrid}>
            {commonTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  form.tags.includes(tag) && styles.tagChipSelected,
                ]}
                onPress={() =>
                  form.tags.includes(tag)
                    ? handleRemoveTag(tag)
                    : handleAddTag(tag)
                }
              >
                <Text
                  style={[
                    styles.tagText,
                    form.tags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customTagContainer}>
            <TextInput
              style={styles.customTagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add custom tag"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddCustomTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddCustomTag}
            >
              <Plus size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {form.tags.length > 0 && (
            <View style={styles.selectedTags}>
              <Text style={styles.selectedTagsTitle}>Selected Tags:</Text>
              <View style={styles.selectedTagsGrid}>
                {form.tags.map((tag) => (
                  <View key={tag} style={styles.selectedTagChip}>
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <X size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Opening Hours</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Set when your court is available for play
          </Text>

          {/* Global Always Open Toggle */}
          <View style={styles.alwaysOpenContainer}>
            <View style={styles.alwaysOpenTextContainer}>
              <Text style={styles.label}>Always Open</Text>
              <Text style={styles.alwaysOpenSubtitle}>
                Court is available 24/7
              </Text>
            </View>
            <Switch
              value={form.openingHours.alwaysOpen}
              onValueChange={updateGlobalAlwaysOpen}
              trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
              thumbColor={form.openingHours.alwaysOpen ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {!form.openingHours.alwaysOpen && (
            <>
              {[
                { key: 'monday', label: 'Monday' },
                { key: 'tuesday', label: 'Tuesday' },
                { key: 'wednesday', label: 'Wednesday' },
                { key: 'thursday', label: 'Thursday' },
                { key: 'friday', label: 'Friday' },
                { key: 'saturday', label: 'Saturday' },
                { key: 'sunday', label: 'Sunday' },
              ].map(({ key, label }) => (
                <View key={key} style={styles.dayHoursContainer}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayLabel}>{label}</Text>
                    <View style={styles.openAllDayContainer}>
                      <Text>Open All Day</Text>
                      <Switch
                        trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
                        thumbColor={
                          form.openingHours[
                            key as keyof Omit<OpeningHours, 'alwaysOpen'>
                          ].alwaysOpen
                            ? '#FFFFFF'
                            : '#FFFFFF'
                        }
                        value={
                          form.openingHours[
                            key as keyof Omit<OpeningHours, 'alwaysOpen'>
                          ].alwaysOpen
                        }
                        onValueChange={(value) => {
                          updateDayHours(
                            key as keyof Omit<OpeningHours, 'alwaysOpen'>,
                            'alwaysOpen',
                            value
                          );
                        }}
                      />
                    </View>
                  </View>

                  {!form.openingHours[
                    key as keyof Omit<OpeningHours, 'alwaysOpen'>
                  ].alwaysOpen && (
                    <View style={styles.timeInputsContainer}>
                      <TimeInput
                        defaultValue={
                          form.openingHours[
                            key as keyof Omit<OpeningHours, 'alwaysOpen'>
                          ].openTime
                        }
                        label="Open Time"
                        onChange={(time: string) =>
                          updateDayHours(
                            key as keyof Omit<OpeningHours, 'alwaysOpen'>,
                            'openTime',
                            time
                          )
                        }
                      />
                      <Text style={styles.timeSeparator}>to</Text>
                      <View style={styles.timeInputGroup}>
                        <TimeInput
                          defaultValue={
                            form.openingHours[
                              key as keyof Omit<OpeningHours, 'alwaysOpen'>
                            ].closeTime
                          }
                          label="Close Time"
                          onChange={(time: string) =>
                            updateDayHours(
                              key as keyof Omit<OpeningHours, 'alwaysOpen'>,
                              'closeTime',
                              time
                            )
                          }
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text
            style={styles.submitButtonText}
            onPress={() => console.log(form)}
          >
            Add Court
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  addressTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  imageContainer: {
    marginBottom: 16,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  tagChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tagChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tagText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  selectedTags: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedTagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  selectedTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  selectedTagText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alwaysOpenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  alwaysOpenTextContainer: {
    flex: 1,
  },
  alwaysOpenSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dayHoursContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  openAllDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
