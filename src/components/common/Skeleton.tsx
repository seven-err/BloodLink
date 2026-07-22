import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as ViewStyle['width'], height: height as ViewStyle['height'], borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb', // Tailwind gray-200
  },
});
