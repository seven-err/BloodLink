import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useUserMode } from '@/context/UserModeContext';
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

  if (mode === 'request') {
    return <RecipientHomeScreen {...props} />;
  }

  return <DonorHomeScreen {...props} />;
}
