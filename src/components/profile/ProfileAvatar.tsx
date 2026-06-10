import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { prefetchProfileAvatar } from '@/services/supabase/profileAvatar';

import { Skeleton } from '@/components/common/Skeleton';
import { profileScreenStyles } from '@/screens/profile/profileScreenStyles';
import { getCachedAvatarUrl } from '@/utils/avatarUrlCache';

type ProfileAvatarProps = {
  avatarPath?: string | null;
  fullName?: string | null;
  size?: number;
  style?: ViewStyle;
};

const getInitials = (fullName: string | null | undefined) => {
  const trimmed = fullName?.trim();

  if (!trimmed) {
    return 'BL';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

export function ProfileAvatar({
  avatarPath,
  fullName,
  size = 72,
  style,
}: ProfileAvatarProps) {
  const normalizedPath = avatarPath?.trim() ?? '';
  const hasAvatarPath = normalizedPath.length > 0;
  const initialCachedUrl = hasAvatarPath ? getCachedAvatarUrl(normalizedPath) : null;
  const [imageUrl, setImageUrl] = useState<string | null>(initialCachedUrl);
  const [imageReady, setImageReady] = useState(Boolean(initialCachedUrl));

  useEffect(() => {
    let cancelled = false;

    if (!hasAvatarPath) {
      setImageUrl(null);
      setImageReady(false);
      return undefined;
    }

    const cachedUrl = getCachedAvatarUrl(normalizedPath);
    setImageUrl(cachedUrl);
    setImageReady(Boolean(cachedUrl));

    const loadAvatar = async () => {
      try {
        const signedUrl = await prefetchProfileAvatar(normalizedPath);

        if (!cancelled && signedUrl) {
          setImageUrl(signedUrl);
          setImageReady(true);
        }
      } catch {
        if (!cancelled) {
          setImageUrl(null);
          setImageReady(false);
        }
      }
    };

    void loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [hasAvatarPath, normalizedPath]);

  const fontSize = Math.round(size * 0.33);
  const radius = size / 2;

  return (
    <View
      style={[
        profileScreenStyles.avatar,
        {
          height: size,
          overflow: 'hidden',
          width: size,
        },
        style,
      ]}
    >
      {hasAvatarPath ? (
        <>
          {imageUrl ? (
            <Image
              resizeMode="cover"
              source={{ uri: imageUrl }}
              style={{ height: size, width: size }}
              onError={() => {
                setImageUrl(null);
                setImageReady(false);
              }}
            />
          ) : null}
          {!imageReady ? (
            <View pointerEvents="none" style={styles.loadingOverlay}>
              <Skeleton borderRadius={radius} height={size} width={size} />
            </View>
          ) : null}
        </>
      ) : (
        <Text style={[profileScreenStyles.avatarInitials, { fontSize }]}>
          {getInitials(fullName)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
