import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { hasRequiredEnv } from '@/config/env';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useNotificationHandler } from '@/hooks/useNotificationHandler';
import { ConfigErrorScreen } from '@/screens/ConfigErrorScreen';

import { AuthProvider } from '@/context/AuthContext';
import { UserModeProvider } from '@/context/UserModeContext';
import { RootNavigator } from '@/navigation/RootNavigator';

function ConfiguredApp() {
  useNotificationHandler();

  // This hook handles web-specific font injection.
  useAppFonts();

  return (
    <AuthProvider>
      <UserModeProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </UserModeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  useAutoUpdate();

  if (!hasRequiredEnv) {
    return (
      <>
        <ConfigErrorScreen />
        <StatusBar style="dark" />
      </>
    );
  }

  return <ConfiguredApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
