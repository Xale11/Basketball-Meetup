import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Clock } from 'lucide-react-native';
import { ImagePicker } from '@/components/ImagePicker';
import { useAuth } from '@/hooks/useAuth';
import { CreateCourtForm, OpeningHours } from '@/types/courts';
import { CourtOpeningHours } from '@/components/courts/CourtOpeningHours';
import { CourtTagSelector } from '@/components/courts/CourtTagSelector';
import {
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import ngeohash from 'ngeohash';
import { useCreateCourt } from '@/hooks/courts/useCreateCourt';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const INITIAL_OPENING_HOURS: OpeningHours = {
  always_open: false,
  monday: { always_open: false, open_time: '', close_time: '23:59' },
  tuesday: { always_open: false, open_time: '', close_time: '23:59' },
  wednesday: { always_open: false, open_time: '', close_time: '23:59' },
  thursday: { always_open: false, open_time: '', close_time: '23:59' },
  friday: { always_open: false, open_time: '', close_time: '23:59' },
  saturday: { always_open: false, open_time: '', close_time: '23:59' },
  sunday: { always_open: false, open_time: '', close_time: '23:59' },
};

export default function AddCourtScreen() {
  const {} = useAuth();
  const { createCourt, loading } = useCreateCourt();

  const [form, setForm] = useState<CreateCourtForm>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    geohash: '',
    description: '',
    images: [],
    tags: [],
    opening_hours: INITIAL_OPENING_HOURS,
    created_by: '',
  });

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
      address: loc?.formatted_address || loc?.formattedAddress || '',
      longitude: loc?.geometry.location.longitude || loc?.geometry.location.lng,
      latitude: loc?.geometry.location.latitude || loc?.geometry.location.lat,
      geohash: ngeohash.encode(
        loc?.geometry.location.latitude || loc?.geometry.location.lat,
        loc?.geometry.location.longitude || loc?.geometry.location.lng,
        9,
      ),
    }));
  };

  const isFormValid = (): boolean => {
    if (!form.name?.trim() || !form.address?.trim()) {
      Alert.alert('Error', 'Please fill in court name and address');
      return false;
    }
    if (isNaN(form.latitude) || isNaN(form.longitude)) {
      Alert.alert('Error', 'Location coordinates are missing or invalid.');
      return false;
    }
    if (!form.opening_hours.always_open) {
      const days: (keyof Omit<OpeningHours, 'always_open'>)[] = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      ];
      for (const day of days) {
        const dayHours = form.opening_hours[day];
        if (!dayHours.open_time.trim() || !dayHours.close_time.trim()) {
          Alert.alert(
            'Error',
            `Please enter both opening and closing times for ${day.charAt(0).toUpperCase() + day.slice(1)}.`,
          );
          return false;
        }
        if (dayHours.open_time.trim() >= dayHours.close_time.trim()) {
          Alert.alert(
            'Error',
            `For ${day.charAt(0).toUpperCase() + day.slice(1)}, the closing time must be after the opening time.`,
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    createCourt(form, {
      onSuccess: () => router.replace('/(tabs)/map'),
      onError: (error) => console.log(error),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Court Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(val) => setForm((prev) => ({ ...prev, name: val }))}
              placeholder="e.g., Central Park Basketball Court"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.addressInput}>
              <MapPin size={20} color="#666" />
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
                onPress={(_, details) => addLocationToForm(details ?? null)}
                enablePoweredByContainer={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
              placeholder="Tell players about this court..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Photos */}
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
                onImageRemoved={() =>
                  setForm((prev) => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index),
                  }))
                }
                placeholder="Court Photo"
              />
            </View>
          ))}

          {form.images.length < 5 && (
            <ImagePicker
              onImageSelected={(uri) =>
                setForm((prev) => ({ ...prev, images: [...prev.images, uri] }))
              }
              placeholder={form.images.length === 0 ? 'Add First Photo' : 'Add Another Photo'}
            />
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.sectionSubtitle}>Select all tags available at this court</Text>
          <CourtTagSelector
            tags={form.tags}
            onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
          />
        </View>

        {/* Opening Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Opening Hours</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Set when your court is available for play</Text>
          <CourtOpeningHours
            value={form.opening_hours}
            onChange={(opening_hours) => setForm((prev) => ({ ...prev, opening_hours }))}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!loading ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Court</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loadingButton}>
            <LoadingSpinner color="white" size="large" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
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
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F8F9FA' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 8 },
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
  textArea: { height: 100, textAlignVertical: 'top' },
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
  imageContainer: { marginBottom: 16 },
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
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadingButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
