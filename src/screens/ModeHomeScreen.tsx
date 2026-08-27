import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useUserMode, type UserMode } from '@/context/UserModeContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { DonorHomeScreen } from '@/screens/donor/DonorHomeScreen';
import { RecipientHomeScreen } from '@/screens/recipient/RecipientHomeScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;


export function ModeHomeScreen(props: Props) {
  const { mode } = useUserMode();
  // The rendered mode lags one tick behind so we fade-out before swapping.
  const [renderedMode, setRenderedMode] = useState<UserMode>(mode);
  const opacity = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (mode === renderedMode) {
      return;
    }

    // Subtle dip and resolve with coordinated sliding toggle
    Animated.timing(opacity, {
      toValue: 0.15,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      if (!isMounted.current) return;
      setRenderedMode(mode);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start();
    });
  }, [mode, renderedMode, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.container, { display: renderedMode === 'donate' ? 'flex' : 'none' }]}>
        <DonorHomeScreen {...props} />
      </View>
      <View style={[styles.container, { display: renderedMode === 'request' ? 'flex' : 'none' }]}>
        <RecipientHomeScreen {...props} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
