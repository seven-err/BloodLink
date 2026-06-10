import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shield, Users, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '@/navigation/types';

import bloodlinkLogo from '../assets/images/bloodlink-new-logo.png';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const PRIMARY = '#E5262A';

type FeatureCardProps = {
  icon: LucideIcon;
  label: string;
};

function FeatureCard({ icon: Icon, label }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Icon color={PRIMARY} size={26} strokeWidth={2} />
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export function WelcomeScreen({ navigation }: Props) {
  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  const handleExistingAccount = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <Image
              accessibilityLabel="BloodLink logo"
              resizeMode="contain"
              source={bloodlinkLogo}
              style={styles.logo}
            />

            <Text style={styles.headline}>Find compatible blood donors faster</Text>
            <Text style={styles.subtitle}>
              Emergency blood donor matching system connecting donors with those in critical need
            </Text>
          </View>

          <View style={styles.featureRow}>
            <FeatureCard icon={Shield} label="Verified Donors" />
            <FeatureCard icon={Zap} label="Emergency Alerts" />
            <FeatureCard icon={Users} label="Secure Health Data" />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleGetStarted}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleExistingAccount}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginBottom: 28,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  featureCard: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    elevation: 2,
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    maxHeight: 100,
    paddingHorizontal: 6,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  featureLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
    width: '100%',
  },
  footer: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  termsLink: {
    color: '#e50914',
  },
  headline: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 34,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    width: '100%',
  },
  logo: {
    height: 150,
    width: 350,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 26,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  safeArea: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    color: '#666666',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 310,
    textAlign: 'center',
  },
});
