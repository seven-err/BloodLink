import { Image, Pressable, StyleSheet, View } from 'react-native';

import hemieImage from '@/assets/images/hemie.png';
import { colors, shadows } from '@/constants/theme';

type HemieFloatingButtonProps = {
  onPress: () => void;
};

const BUTTON_SIZE = 72;
const RING_SIZE = BUTTON_SIZE;
const IMAGE_SIZE = 54;

export function HemieFloatingButton({ onPress }: HemieFloatingButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Open Hemie AI assistant"
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      onPress={onPress}
    >
      <View style={styles.shadow}>
        <View style={styles.ring}>
          <View style={styles.imageClip}>
            <Image resizeMode="cover" source={hemieImage} style={styles.image} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    bottom: 24,
    height: BUTTON_SIZE,
    position: 'absolute',
    right: 20,
    width: BUTTON_SIZE,
    zIndex: 20,
  },
  image: {
    height: IMAGE_SIZE,
    width: IMAGE_SIZE,
  },
  imageClip: {
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: IMAGE_SIZE / 2,
    height: IMAGE_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: IMAGE_SIZE,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.96 }],
  },
  ring: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    height: RING_SIZE,
    justifyContent: 'center',
    width: RING_SIZE,
  },
  shadow: {
    borderRadius: RING_SIZE / 2,
    ...shadows.card,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});
