import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useUserMode } from '@/context/UserModeContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { DonorRequestFeedScreen } from '@/screens/donor/DonorRequestFeedScreen';
import { MyBloodRequestsScreen } from '@/screens/recipient/MyBloodRequestsScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Requests'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function ModeRequestsScreen(props: Props) {
  const { mode } = useUserMode();

  if (mode === 'request') {
    return <MyBloodRequestsScreen {...props} />;
  }

  return <DonorRequestFeedScreen {...props} />;
}
