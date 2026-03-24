import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { uploadToSupabaseBucket } from '@/api/supabase-storage.api';
import { updateUser } from '@/api/users.api';

export default function useUpdateProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [photoUploading, setPhotoUploading] = useState(false);

  const uploadPhoto = async (uri: string) => {
    if (!userId) return;
    try {
      setPhotoUploading(true);
      console.log('[useUpdateProfilePhoto] uploading photo');
      const photoUrl = await uploadToSupabaseBucket(uri, `profilePhotos/${userId}`, 'profile');
      await updateUser(userId, { photoUrl });
      await queryClient.invalidateQueries({ queryKey: ['userFetchById', userId] });
      console.log('[useUpdateProfilePhoto] photo updated');
    } catch (e) {
      console.error('[useUpdateProfilePhoto] upload failed', e);
      Alert.alert('Error', 'Failed to update photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!userId) return;
    try {
      setPhotoUploading(true);
      console.log('[useUpdateProfilePhoto] removing photo');
      await updateUser(userId, { photoUrl: null as any });
      await queryClient.invalidateQueries({ queryKey: ['userFetchById', userId] });
      console.log('[useUpdateProfilePhoto] photo removed');
    } catch (e) {
      console.error('[useUpdateProfilePhoto] remove failed', e);
    } finally {
      setPhotoUploading(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access.');
      return;
    }
    const result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await uploadPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access.');
      return;
    }
    const result = await ImagePickerExpo.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) await uploadPhoto(result.assets[0].uri);
  };

  const handlePhotoPress = (hasPhoto: boolean) => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Photo Library', onPress: pickPhoto },
      { text: 'Take Photo', onPress: takePhoto },
      ...(hasPhoto ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: removePhoto }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return { photoUploading, handlePhotoPress };
}
