import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/services/supabase/auth';

export function RestrictedAccessScreen() {
  const { profile } = useAuth();
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Blood bank / PRC personnel';

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mobile access restricted</Text>
        <Text style={styles.title}>Use the web dashboard</Text>
        <Text style={styles.subtitle}>
          The BloodLink mobile app is for donors and recipients only. As {roleLabel}, please sign
          in to the BloodLink web dashboard to manage operations.
        </Text>
      </View>

      <PrimaryButton title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
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
