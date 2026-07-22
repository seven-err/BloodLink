import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Shield, Users, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors, radii, shadows } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

import bloodlinkLogo from '../assets/images/bloodlink-new-logo.png';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

type FeatureCardProps = {
  icon: LucideIcon;
  label: string;
};

function FeatureCard({ icon: Icon, label }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Icon color={colors.primary} size={26} strokeWidth={2} />
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

  const openLegalInfo = (title: string) => {
    Alert.alert(
      title,
      `${title} details will open here in a future update. For now, contact support@bloodlink.app with any questions.`,
    );
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
            <PrimaryButton title="Get Started" onPress={handleGetStarted} />
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleExistingAccount}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our{' '}
            <Text
              accessibilityRole="link"
              style={styles.termsLink}
              onPress={() => openLegalInfo('Terms of Service')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              accessibilityRole="link"
              style={styles.termsLink}
              onPress={() => openLegalInfo('Privacy Policy')}
            >
              Privacy Policy
            </Text>
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
    backgroundColor: colors.card,
    borderRadius: 14,
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    maxHeight: 100,
    paddingHorizontal: 6,
    paddingVertical: 14,
    ...shadows.card,
  },
  featureLabel: {
    color: colors.muted,
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
    color: colors.mutedLight,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  headline: {
    color: colors.foreground,
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
  safeArea: {
    backgroundColor: colors.card,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 310,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
