import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { signUpWithEmail } from '@/services/supabase/auth';
import { normalizePhoneNumber } from '@/utils/phone';
import { PASSWORD_RULES, signupPasswordSchema } from '@/utils/password';
import { AuthBrand } from './AuthBrand';
import { AuthIcon, MutedIcon } from './icons';
import { AuthTabs } from './AuthTabs';
import { SecurityFooter } from './SecurityFooter';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const schema = z
  .object({
    confirmPassword: z.string(),
    email: z.string().email('Enter a valid email address.'),
    fullName: z.string().min(2, 'Full name is required.'),
    password: signupPasswordSchema,
    phone: z.string().min(10, 'Enter a valid mobile number.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type SignupValues = z.infer<typeof schema>;

export function SignupScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
      phone: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, fullName, password, phone }: SignupValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: signupError } = await signUpWithEmail(
        email,
        password,
        fullName,
        normalizePhoneNumber(phone),
      );

      if (signupError) {
        setError(signupError.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to create your account.');
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
          <Text style={authStyles.title}>Create your account</Text>
          <Text style={authStyles.subtitle}>Join BloodLink and be a hero today.</Text>
        </View>
        <AuthTabs
          active="signup"
          onLogin={() => navigation.navigate('Login')}
          onSignup={() => undefined}
        />
        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                error={errors.fullName?.message}
                label=""
                leftIcon={<AuthIcon name="user" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Full name"
                value={value}
              />
            )}
          />
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
            name="phone"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                autoComplete="tel"
                error={errors.phone?.message}
                keyboardType="phone-pad"
                label=""
                leftIcon={<AuthIcon name="phone" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mobile number"
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
                placeholder="Create password"
                rightIcon={<MutedIcon name={passwordVisible ? 'unlock' : 'lock'} />}
                secureTextEntry={!passwordVisible}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                error={errors.confirmPassword?.message}
                label=""
                leftIcon={<AuthIcon name="lock" />}
                onBlur={onBlur}
                onChangeText={onChange}
                onRightIconPress={() => setConfirmVisible((visible) => !visible)}
                placeholder="Confirm password"
                rightIcon={<MutedIcon name={confirmVisible ? 'unlock' : 'lock'} />}
                secureTextEntry={!confirmVisible}
                value={value}
              />
            )}
          />
          <View style={styles.rules}>
            {PASSWORD_RULES.hints.map((hint) => (
              <Text key={hint} style={styles.rule}>
                ✓ {hint}
              </Text>
            ))}
          </View>
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} title="Sign Up" onPress={handleSubmit(onSubmit)} />
          <Pressable onPress={() => navigation.navigate('EnterPhone', { mode: 'signup' })}>
            <Text style={authStyles.link}>Or sign up with phone OTP</Text>
          </Pressable>
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
  form: {
    gap: 12,
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  rule: {
    color: '#71717a',
    fontSize: 14,
  },
  rules: {
    gap: 8,
    paddingHorizontal: 2,
  },
  screen: {
    backgroundColor: '#fafafa',
    flex: 1,
  },
});
