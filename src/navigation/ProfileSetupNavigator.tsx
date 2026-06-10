import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileCompletionScreen } from '@/screens/auth/ProfileCompletionScreen';

export type ProfileSetupStackParamList = {
  ProfileCompletion: undefined;
};

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

export function ProfileSetupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: {
          backgroundColor: '#fef2f2',
        },
        headerShown: false,
      }}
    >
      <Stack.Screen component={ProfileCompletionScreen} name="ProfileCompletion" />
    </Stack.Navigator>
  );
}
