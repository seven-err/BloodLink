import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthBrand } from './AuthBrand';
import { AuthDivider } from './AuthDivider';
import { AuthIcon, MutedIcon } from './icons';
import { AuthTabs } from './AuthTabs';
import { SecurityFooter } from './SecurityFooter';
import { SocialButton } from './SocialButton';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
    >
      <AuthBrand />
      <View style={styles.heading}>
        <Text style={authStyles.title}>Welcome back!</Text>
        <Text style={authStyles.subtitle}>Log in to continue saving lives.</Text>
      </View>
      <AuthTabs
        active="login"
        onLogin={() => undefined}
        onSignup={() => navigation.navigate('Signup')}
      />
      <View style={styles.socials}>
        <SocialButton icon={<MutedIcon name="apple" />} title="Continue with Apple" />
        <SocialButton icon={<AuthIcon name="google" />} title="Continue with Google" />
      </View>
      <AuthDivider />
      <View style={styles.actions}>
        <PrimaryButton title="Login with Email" onPress={() => navigation.navigate('Login')} />
        <PrimaryButton
          title="Login with Phone OTP"
          variant="secondary"
          onPress={() => navigation.navigate('EnterPhone', { mode: 'login' })}
        />
        <Pressable onPress={() => navigation.navigate('EnterPhone', { mode: 'signup' })}>
          <Text style={authStyles.link}>Sign up with phone OTP</Text>
        </Pressable>
      </View>
      <SecurityFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    gap: 28,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 44,
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  screen: {
    backgroundColor: '#fafafa',
  },
  socials: {
    gap: 14,
  },
});
