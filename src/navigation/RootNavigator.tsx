import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { AuthProfileErrorScreen } from '@/screens/AuthProfileErrorScreen';
import { RestrictedAccessScreen } from '@/screens/RestrictedAccessScreen';
import { isMobileAppRole, isStaffRole } from '@/utils/roles';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator() {
  const { authError, initializing, profile, profileComplete, session } = useAuth();
  const showRestrictedAccess = Boolean(session && isStaffRole(profile?.role));
  const showApp = Boolean(
    session && profileComplete && isMobileAppRole(profile?.role),
  );

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={styles.loadingText}>Loading BloodLink...</Text>
        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
      </View>
    );
  }

  if (authError) {
    return <AuthProfileErrorScreen />;
  }

  return (
    <NavigationContainer>
      {showRestrictedAccess ? (
        <RestrictedAccessScreen />
      ) : showApp ? (
        <AppNavigator />
      ) : (
        <AuthNavigator
          key={session ? 'profile-completion' : 'login'}
          initialRouteName={session ? 'ProfileCompletion' : 'Login'}
        />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#991b1b',
    fontWeight: '700',
  },
});
