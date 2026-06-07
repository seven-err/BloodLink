import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import type { AuthStackParamList } from '@/navigation/types';
import { signInWithEmail } from '@/services/supabase/auth';
import { loginPasswordSchema } from '@/utils/password';
import { AuthBrand } from './AuthBrand';
import { AuthDivider } from './AuthDivider';
import { AuthIcon, MutedIcon } from './icons';
import { AuthTabs } from './AuthTabs';
import { SecurityFooter } from './SecurityFooter';
import { SocialButton } from './SocialButton';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: loginPasswordSchema,
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: loginError } = await signInWithEmail(email, password);

      if (loginError) {
        setError(loginError.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                keyboardType="email-address"
                label=""
                leftIcon={<AuthIcon name="email" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Email address"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                error={errors.password?.message}
                label=""
                leftIcon={<AuthIcon name="lock" />}
                onBlur={onBlur}
                onChangeText={onChange}
                onRightIconPress={() => setPasswordVisible((visible) => !visible)}
                placeholder="Password"
                rightIcon={<MutedIcon name={passwordVisible ? 'unlock' : 'lock'} />}
                secureTextEntry={!passwordVisible}
                value={value}
              />
            )}
          />
          <Pressable
            onPress={() =>
              Alert.alert(
                'Password reset',
                'Use phone OTP login for this demo, or contact support to reset your password.',
              )
            }
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} title="Login" onPress={handleSubmit(onSubmit)} />
          <PrimaryButton
            title="Use phone OTP"
            variant="secondary"
            onPress={() => navigation.navigate('EnterPhone', { mode: 'login' })}
          />
        </View>
        <SecurityFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  forgot: {
    color: '#e50914',
    fontSize: 16,
    fontWeight: '700',
  },
  form: {
    gap: 14,
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  screen: {
    backgroundColor: '#fafafa',
    flex: 1,
  },
  socials: {
    gap: 14,
  },
});
