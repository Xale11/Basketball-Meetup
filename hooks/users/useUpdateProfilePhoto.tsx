import { Alert } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadToSupabaseBucket } from '@/api/supabase-storage.api';
import { updateUser } from '@/api/users.api';
import { User } from '@/types/user';
import { qk } from '@/lib/queryKeys';

/**
 * Was a hand-rolled `useState` + try/catch. Now a mutation, so upload and
 * removal share one pending flag and one cache-update path.
 */
export default function useUpdateProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation<User, Error, { uri: string | null }>({
    mutationFn: async ({ uri }) => {
      if (!userId) throw new Error('No user id available to update the photo');

      // `uri === null` means "remove the current photo".
      const photoUrl = uri
        ? await uploadToSupabaseBucket(uri, `profilePhotos/${userId}`, 'profile')
        : null;

      return updateUser(userId, { photo_url: photoUrl } as Partial<User>);
    },
    onSuccess: (updated) => {
      if (updated) queryClient.setQueryData(qk.users.detail(userId), updated);
      queryClient.invalidateQueries({ queryKey: qk.users.detail(userId) });
    },
    onError: (e) => {
      console.error('[useUpdateProfilePhoto] failed', e);
      Alert.alert('Error', 'Failed to update photo. Please try again.');
    },
  });

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
    if (!result.canceled && result.assets[0]) mutation.mutate({ uri: result.assets[0].uri });
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
    if (!result.canceled && result.assets[0]) mutation.mutate({ uri: result.assets[0].uri });
  };

  const handlePhotoPress = (hasPhoto: boolean) => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Photo Library', onPress: pickPhoto },
      { text: 'Take Photo', onPress: takePhoto },
      ...(hasPhoto
        ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => mutation.mutate({ uri: null }) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return { photoUploading: mutation.isPending, handlePhotoPress };
}
