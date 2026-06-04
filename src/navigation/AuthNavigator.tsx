import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/navigation/types';
import { EnterPhoneScreen } from '@/screens/auth/EnterPhoneScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ProfileCompletionScreen } from '@/screens/auth/ProfileCompletionScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { VerifyOtpScreen } from '@/screens/auth/VerifyOtpScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export function AuthNavigator({ initialRouteName = 'Welcome' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        contentStyle: {
          backgroundColor: '#fef2f2',
        },
        headerShadowVisible: false,
        headerShown: false,
        headerTintColor: '#991b1b',
      }}
    >
      <Stack.Screen
        component={WelcomeScreen}
        name="Welcome"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={EnterPhoneScreen}
        name="EnterPhone"
        options={{ title: 'Phone verification' }}
      />
      <Stack.Screen
        component={VerifyOtpScreen}
        name="VerifyOtp"
        options={{ title: 'Verify OTP' }}
      />
      <Stack.Screen component={LoginScreen} name="Login" options={{ title: 'Login' }} />
      <Stack.Screen
        component={SignupScreen}
        name="Signup"
        options={{ title: 'Sign Up' }}
      />
      <Stack.Screen
        component={ProfileCompletionScreen}
        name="ProfileCompletion"
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: 'Complete Profile',
        }}
      />
    </Stack.Navigator>
  );
}
