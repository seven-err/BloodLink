import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii } from '@/constants/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_DISMISS_THRESHOLD = 90;
const DEFAULT_VELOCITY_THRESHOLD = 0.45;

type SwipeableBottomSheetModalProps = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  maxHeight?: number | string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  hideHandle?: boolean;
};

export function SwipeableBottomSheetModal({
  visible,
  onDismiss,
  children,
  maxHeight = '82%',
  style,
  contentContainerStyle,
  hideHandle = false,
}: SwipeableBottomSheetModalProps) {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const isDismissing = useRef(false);
  const prevVisibleRef = useRef(visible);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const numericMaxHeight = useMemo(() => {
    if (typeof maxHeight === 'number') {
      return maxHeight;
    }
    if (typeof maxHeight === 'string' && maxHeight.endsWith('%')) {
      const pct = parseFloat(maxHeight) / 100;
      return SCREEN_HEIGHT * (isNaN(pct) ? 0.82 : pct);
    }
    return SCREEN_HEIGHT * 0.82;
  }, [maxHeight]);

  const handleDismiss = useCallback(
    (velocity = 0) => {
      if (isDismissing.current) {
        return;
      }
      isDismissing.current = true;

      const duration = velocity > 1 ? 140 : 200;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.9,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scrimAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isDismissing.current = false;
        setRendered(false);
        onDismissRef.current();
      });
    },
    [scrimAnim, translateY],
  );

  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (visible && !wasVisible) {
      isDismissing.current = false;
      setRendered(true);
      translateY.setValue(SCREEN_HEIGHT * 0.75);
      scrimAnim.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          mass: 0.8,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scrimAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && wasVisible) {
      handleDismiss();
    }
  }, [handleDismiss, scrimAnim, translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          isDragging.current = true;
          translateY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            // Sliding down tracks finger in real time
            translateY.setValue(gestureState.dy);
          } else {
            // Subtle upward rubber-banding
            translateY.setValue(gestureState.dy * 0.18);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          isDragging.current = false;
          if (
            gestureState.dy > DEFAULT_DISMISS_THRESHOLD ||
            gestureState.vy > DEFAULT_VELOCITY_THRESHOLD
          ) {
            handleDismiss(gestureState.vy);
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              damping: 24,
              mass: 0.8,
              stiffness: 220,
              velocity: gestureState.vy,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [handleDismiss, translateY],
  );

  // Dynamic dimming: smoothly dims as sheet slides down
  const backdropOpacity = Animated.multiply(
    scrimAnim,
    translateY.interpolate({
      inputRange: [0, SCREEN_HEIGHT * 0.5],
      outputRange: [0.45, 0],
      extrapolate: 'clamp',
    }),
  );

  if (!rendered) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible={rendered}
      onRequestClose={() => handleDismiss()}
    >
      <View style={styles.container}>
        {/* Animated backdrop scrim with dynamic real-time dimming */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessibilityLabel="Close sheet"
            style={StyleSheet.absoluteFill}
            onPress={() => handleDismiss()}
          />
        </Animated.View>

        {/* Sliding sheet following finger in real time */}
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: numericMaxHeight },
            style,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Draggable handle bar */}
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            {!hideHandle ? <View style={styles.handle} /> : null}
          </View>

          {/* Interactive content */}
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    flexShrink: 1,
  },
  dragZone: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 12,
    width: '100%',
  },
  handle: {
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    height: 5,
    width: 44,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 24,
    width: '100%',
  },
});
