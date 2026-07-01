import { Image, StyleSheet, View } from 'react-native';

import hemieImage from '@/assets/images/hemie.png';
import { colors } from '@/constants/theme';

type HemieAvatarProps = {
  size?: number;
};

export function HemieAvatar({ size = 40 }: HemieAvatarProps) {
  const imageSize = Math.round(size * 0.78);

  return (
    <View style={[styles.ring, { borderRadius: size / 2, height: size, width: size }]}>
      <View
        style={[
          styles.imageClip,
          {
            borderRadius: imageSize / 2,
            height: imageSize,
            width: imageSize,
          },
        ]}
      >
        <Image
          resizeMode="cover"
          source={hemieImage}
          style={{ height: imageSize, width: imageSize }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageClip: {
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 2,
    justifyContent: 'center',
  },
});
