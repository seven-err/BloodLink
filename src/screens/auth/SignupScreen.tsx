import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { colors } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';
import {
  getSignupErrorMessage,
  isDuplicateEmailSignup,
  resendSignupConfirmation,
  signUpWithEmail,
} from '@/services/supabase/auth';
import { normalizePhoneNumber } from '@/utils/phone';
import { signupPasswordSchema } from '@/utils/password';
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
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(
    null,
  );
  const [resentConfirmation, setResentConfirmation] = useState(false);
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
    setPendingConfirmationEmail(null);
    setResentConfirmation(false);
    setLoading(true);

    try {
      const { data, error: signupError } = await signUpWithEmail(
        email,
        password,
        fullName,
        normalizePhoneNumber(phone),
      );

      if (signupError) {
        setError(getSignupErrorMessage(signupError.message));
        return;
      }

      if (isDuplicateEmailSignup(data.user)) {
        const { error: resendError } = await resendSignupConfirmation(email);

        if (resendError) {
          setError(
            'An account with this email already exists. Log in instead, or use Forgot Password if you need access.',
          );
          return;
        }

        setResentConfirmation(true);
        setPendingConfirmationEmail(email);
        return;
      }

      if (!data.session) {
        setPendingConfirmationEmail(email);
        return;
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
        {pendingConfirmationEmail ? null : (
          <>
            <View style={styles.heading}>
              <Text style={authStyles.title}>Create your account</Text>
              <Text style={authStyles.subtitle}>Join BloodLink and be a hero today.</Text>
            </View>
            <AuthTabs
              active="signup"
              onLogin={() => navigation.navigate('Login')}
              onSignup={() => undefined}
            />
          </>
        )}
        {pendingConfirmationEmail ? (
          <View style={styles.confirmationCard}>
            <Text style={authStyles.title}>Check your email</Text>
            <Text style={authStyles.subtitle}>
              {resentConfirmation
                ? `We resent a confirmation link to ${pendingConfirmationEmail}.`
                : `We sent a confirmation link to ${pendingConfirmationEmail}.`}
            </Text>
            <Text style={authStyles.success}>
              Tap the confirmation link in your email to verify your account. Keep the BloodLink app
              or web tab open (Expo web runs on port 8081). After confirming, log in with the same
              email and password.
            </Text>
            <Text style={authStyles.helper}>
              If you do not see the email, check your spam folder (including Promotions) or wait a
              few minutes. Supabase sends from noreply@mail.app.supabase.io — add it to your safe
              senders if needed.
            </Text>
            <PrimaryButton
              title="Back to login"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        ) : (
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
                rightIcon={<MutedIcon name={passwordVisible ? 'eye-off' : 'eye'} />}
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
                rightIcon={<MutedIcon name={confirmVisible ? 'eye-off' : 'eye'} />}
                secureTextEntry={!confirmVisible}
                value={value}
              />
            )}
          />
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} title="Sign Up" onPress={handleSubmit(onSubmit)} />
        </View>
        )}
        <SecurityFooter />
        {!pendingConfirmationEmail && (
          <Text style={styles.termsText}>
            By signing up, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  confirmationCard: {
    gap: 18,
  },
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  termsText: {
    color: colors.mutedLight,
    fontSize: 12,
    marginTop: 32,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary,
  },
});
