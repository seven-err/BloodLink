import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Droplet, HeartHandshake } from 'lucide-react-native';

import { colors, radii, shadows } from '@/constants/theme';
import { useUserMode, type UserMode } from '@/context/UserModeContext';

type ModeOption = {
  icon: typeof Droplet;
  label: string;
  mode: UserMode;
};

const MODE_OPTIONS: ModeOption[] = [
  { icon: Droplet, label: 'Donate', mode: 'donate' },
  { icon: HeartHandshake, label: 'Request', mode: 'request' },
];

type ModeToggleProps = {
  showHint?: boolean;
};

export function ModeToggle({ showHint = false }: ModeToggleProps) {
  const { mode, setMode } = useUserMode();
  const [containerWidth, setContainerWidth] = useState(0);

  const targetIndex = mode === 'request' ? 1 : 0;
  const animValue = useRef(new Animated.Value(targetIndex)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: targetIndex,
      useNativeDriver: true,
      damping: 24,
      stiffness: 280,
      mass: 0.8,
    }).start();
  }, [animValue, targetIndex]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const segmentWidth = containerWidth > 0 ? (containerWidth - 6) / 2 : 0;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel="Switch between donate and request mode"
        accessibilityRole="tablist"
        onLayout={handleLayout}
        style={styles.container}
      >
        {/* Animated Sliding Pill Background */}
        {segmentWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                width: segmentWidth,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {MODE_OPTIONS.map(({ icon: Icon, label, mode: optionMode }, index) => {
          const isSelected = mode === optionMode;

          const activeOpacity = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: index === 0 ? [1, 0] : [0, 1],
          });

          const inactiveOpacity = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: index === 0 ? [0, 1] : [1, 0],
          });

          return (
            <Pressable
              key={optionMode}
              accessibilityLabel={`${label} mode`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.segment,
                pressed ? styles.segmentPressed : null,
              ]}
              onPress={() => setMode(optionMode)}
            >
              {/* Inactive state layer (grey) */}
              <Animated.View
                pointerEvents="none"
                style={[styles.segmentContent, { opacity: inactiveOpacity }]}
              >
                <Icon color={colors.muted} size={16} strokeWidth={2.25} />
                <Text style={styles.labelInactive}>{label}</Text>
              </Animated.View>

              {/* Active state layer (white bold) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentContent,
                  styles.segmentContentAbsolute,
                  { opacity: activeOpacity },
                ]}
              >
                <Icon color={colors.primaryForeground} size={16} strokeWidth={2.5} />
                <Text style={styles.labelActive}>{label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>

      {showHint ? (
        <Text style={styles.hint}>
          {mode === 'donate'
            ? 'Donate mode shows nearby blood requests you can help with.'
            : 'Request mode lets you create requests and find compatible donors.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e2e8f0',
    borderRadius: radii.pill,
    flexDirection: 'row',
    height: 44,
    padding: 3,
    position: 'relative',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  labelActive: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '700',
  },
  labelInactive: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  segmentContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  segmentContentAbsolute: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  slidingIndicator: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    bottom: 3,
    left: 3,
    position: 'absolute',
    top: 3,
    zIndex: 1,
    ...shadows.card,
  },
  wrap: {
    width: '100%',
  },
});
