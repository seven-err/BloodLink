import { Image } from 'react-native';

import { readDocumentAsArrayBuffer } from '@/utils/readLocalFile';
import {
  clearCachedAvatarUrl,
  getCachedAvatarUrl,
  setCachedAvatarUrl,
} from '@/utils/avatarUrlCache';

import { supabase } from './client';
import type { LocalDocument } from './storageUpload';

const PROFILE_IMAGES_BUCKET = 'profile-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const extensionFromMime = (mimeType: string | null | undefined) => {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
};

const contentTypeFromMime = (mimeType: string | null | undefined) => mimeType ?? 'image/jpeg';

export const uploadProfileAvatar = async (userId: string, image: LocalDocument) => {
  const extension = extensionFromMime(image.mimeType);
  const path = `${userId}/avatar.${extension}`;
  const arrayBuffer = await readDocumentAsArrayBuffer(image);
  const contentType = contentTypeFromMime(image.mimeType);

  clearCachedAvatarUrl(path);

  const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return path;
};

export const getProfileAvatarSignedUrl = async (avatarPath: string) => {
  const cachedUrl = getCachedAvatarUrl(avatarPath);

  if (cachedUrl) {
    return cachedUrl;
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .createSignedUrl(avatarPath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  setCachedAvatarUrl(avatarPath, data.signedUrl);

  return data.signedUrl;
};

export const prefetchProfileAvatar = async (avatarPath: string | null | undefined) => {
  const normalizedPath = avatarPath?.trim();

  if (!normalizedPath) {
    return null;
  }

  const signedUrl = await getProfileAvatarSignedUrl(normalizedPath);

  try {
    await Image.prefetch(signedUrl);
  } catch {
    // Prefetch is best-effort; the avatar still loads on demand.
  }

  return signedUrl;
};
