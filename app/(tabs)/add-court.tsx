import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, X } from 'lucide-react-native';
import { ImagePicker } from '@/components/ImagePicker';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/firebase/firebase';
import { useEffect } from 'react';

export default function AddCourtScreen() {
  const {  } = useAuth();

  const [courtName, setCourtName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');

  const commonAmenities = [
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
    setImages([...images, uri]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddAmenity = (amenity: string) => {
    if (!amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const handleAddCustomAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const handleSubmit = () => {
    if (!courtName.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in court name and address');
      return;
    }

    // Here you would typically save to your backend
    Alert.alert(
      'Success',
      'Court added successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Court Name *</Text>
            <TextInput
              style={styles.input}
              value={courtName}
              onChangeText={setCourtName}
              placeholder="e.g., Central Park Basketball Court"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.addressInput}>
              <MapPin size={20} color="#666" />
              <TextInput
                style={styles.addressTextInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter court address"
                placeholderTextColor="#999"
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell players about this court..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Add photos to help players find and recognize the court</Text>
          
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <ImagePicker
                selectedImage={image}
                onImageSelected={() => {}}
                onImageRemoved={() => handleRemoveImage(index)}
                placeholder="Court Photo"
              />
            </View>
          ))}
          
          {images.length < 5 && (
            <ImagePicker
              onImageSelected={handleAddImage}
              placeholder={images.length === 0 ? "Add First Photo" : "Add Another Photo"}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <Text style={styles.sectionSubtitle}>Select all amenities available at this court</Text>
          
          <View style={styles.amenitiesGrid}>
            {commonAmenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityChip,
                  amenities.includes(amenity) && styles.amenityChipSelected
                ]}
                onPress={() => 
                  amenities.includes(amenity) 
                    ? handleRemoveAmenity(amenity)
                    : handleAddAmenity(amenity)
                }
              >
                <Text style={[
                  styles.amenityText,
                  amenities.includes(amenity) && styles.amenityTextSelected
                ]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customAmenityContainer}>
            <TextInput
              style={styles.customAmenityInput}
              value={newAmenity}
              onChangeText={setNewAmenity}
              placeholder="Add custom amenity"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddCustomAmenity}
            />
            <TouchableOpacity 
              style={styles.addAmenityButton}
              onPress={handleAddCustomAmenity}
            >
              <Plus size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {amenities.length > 0 && (
            <View style={styles.selectedAmenities}>
              <Text style={styles.selectedAmenitiesTitle}>Selected Amenities:</Text>
              <View style={styles.selectedAmenitiesGrid}>
                {amenities.map((amenity) => (
                  <View key={amenity} style={styles.selectedAmenityChip}>
                    <Text style={styles.selectedAmenityText}>{amenity}</Text>
                    <TouchableOpacity onPress={() => handleRemoveAmenity(amenity)}>
                      <X size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Court</Text>
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  amenityChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  amenityChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  amenityText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  amenityTextSelected: {
    color: '#FFFFFF',
  },
  customAmenityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  customAmenityInput: {
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
  addAmenityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  selectedAmenities: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedAmenitiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  selectedAmenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedAmenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  selectedAmenityText: {
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
});