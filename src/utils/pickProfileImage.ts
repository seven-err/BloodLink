import * as ImagePicker from 'expo-image-picker';

import type { LocalDocument } from '@/services/supabase/storageUpload';

export const pickProfileImage = async (): Promise<LocalDocument | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Photo library permission is required to choose a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ['images'],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset.base64) {
    throw new Error('Unable to read the selected image. Please try another photo.');
  }

  return {
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? 'profile-photo.jpg',
    uri: asset.uri,
  };
};
