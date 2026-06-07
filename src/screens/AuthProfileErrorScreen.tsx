import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/services/supabase/auth';

export function AuthProfileErrorScreen() {
  const { authError, authRetrying, retryAuth, session } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Something went wrong</Text>
        <Text style={styles.title}>Unable to continue</Text>
        <Text style={styles.subtitle}>
          {authError ?? 'We could not verify your account right now. Please try again.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton loading={authRetrying} title="Try again" onPress={retryAuth} />
        {session ? (
          <PrimaryButton title="Sign out" variant="secondary" onPress={signOut} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    gap: 10,
    padding: 24,
  },
  eyebrow: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  screen: {
    backgroundColor: '#fef2f2',
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#991b1b',
    fontSize: 30,
    fontWeight: '800',
  },
});
