import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/services/supabase/auth';
import { AuthNavigator } from './AuthNavigator';

function AppHome() {
  const { profile } = useAuth();

  return (
    <View style={styles.home}>
      <Text style={styles.title}>Welcome to BloodLink</Text>
      <Text style={styles.subtitle}>
        {profile?.full_name
          ? `${profile.full_name}, your profile is ready.`
          : 'Your profile is ready.'}
      </Text>
      <PrimaryButton title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

export function RootNavigator() {
  const { initializing, profileComplete, session } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={styles.loadingText}>Loading BloodLink...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session && profileComplete ? (
        <AppHome />
      ) : (
        <AuthNavigator
          initialRouteName={session ? 'ProfileCompletion' : 'Welcome'}
        />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  home: {
    backgroundColor: '#fef2f2',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
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
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
  },
  title: {
    color: '#991b1b',
    fontSize: 30,
    fontWeight: '800',
  },
});
