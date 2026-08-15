import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { hasRequiredEnv } from '@/config/env';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { ConfigErrorScreen } from '@/screens/ConfigErrorScreen';

import { useNotificationHandler } from '@/hooks/useNotificationHandler';

function ConfiguredApp() {
  useNotificationHandler();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AuthProvider } = require('@/context/AuthContext') as typeof import('@/context/AuthContext');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UserModeProvider } = require('@/context/UserModeContext') as typeof import('@/context/UserModeContext');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RootNavigator } = require('@/navigation/RootNavigator') as typeof import('@/navigation/RootNavigator');

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

