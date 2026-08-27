import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { useUserMode, type UserMode } from '@/context/UserModeContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { DonorRequestFeedScreen } from '@/screens/donor/DonorRequestFeedScreen';
import { MyBloodRequestsScreen } from '@/screens/recipient/MyBloodRequestsScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Requests'>,
  NativeStackScreenProps<AppStackParamList>
>;

function ModeRequestsContent({ mode, props }: { mode: UserMode; props: Props }) {
  if (mode === 'request') {
    return <MyBloodRequestsScreen {...props} />;
  }

  return <DonorRequestFeedScreen {...props} />;
}

export function ModeRequestsScreen(props: Props) {
  const { mode } = useUserMode();
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
      <ModeRequestsContent mode={renderedMode} props={props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
