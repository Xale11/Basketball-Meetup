import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePickerExpo from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  onImageRemoved?: () => void;
  selectedImage?: string;
  placeholder?: string;
}

export function ImagePicker({ 
  onImageSelected, 
  onImageRemoved, 
  selectedImage, 
  placeholder = "Add Photo" 
}: ImagePickerProps) {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant permission to access your photo library to upload images.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take photos.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (selectedImage) {
    return (
      <View style={styles.selectedImageContainer}>
        <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        {onImageRemoved && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={onImageRemoved}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={showImageOptions}
      disabled={loading}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Camera size={32} color="#FF6B35" />
        </View>
        <Text style={styles.text}>{placeholder}</Text>
        <Text style={styles.subtext}>Tap to add from camera or gallery</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});