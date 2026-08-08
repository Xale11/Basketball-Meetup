import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePickerExpo from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

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
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        mediaTypes: ['images'],
        allowsEditing: false,
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
        allowsEditing: false,
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
          <Camera size={32} color={theme.colors.accentHi} />
        </View>
        <Text style={styles.text}>{placeholder}</Text>
        <Text style={styles.subtext}>Tap to add from camera or gallery</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.card,
      borderWidth: 2,
      borderColor: t.colors.borderStrong,
      borderStyle: 'dashed',
      padding: t.spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
    },
    content: {
      alignItems: 'center',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.colors.accentTone.bg,
      borderWidth: 1,
      borderColor: t.colors.accentTone.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: t.spacing.lg,
    },
    text: {
      ...t.typography.h3,
      color: t.colors.textPrimary,
      marginBottom: 4,
    },
    subtext: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      textAlign: 'center',
    },
    selectedImageContainer: {
      position: 'relative',
      borderRadius: t.radius.card,
      overflow: 'hidden',
    },
    selectedImage: {
      width: '100%',
      height: 200,
      borderRadius: t.radius.card,
    },
    removeButton: {
      position: 'absolute',
      top: t.spacing.md,
      right: t.spacing.md,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });