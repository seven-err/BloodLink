import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { UserModeProvider } from '@/context/UserModeContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserModeProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </UserModeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
