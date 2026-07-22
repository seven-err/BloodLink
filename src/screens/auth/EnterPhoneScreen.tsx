import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { colors } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';
import { signInWithGoogle } from '@/services/supabase/auth';
import { getLoginErrorMessage } from '@/utils/loginErrors';
import { normalizePhoneNumber } from '@/utils/phone';
import { AuthBackButton } from './AuthBackButton';
import { AuthBrand } from './AuthBrand';
import { AuthDivider } from './AuthDivider';
import { AuthIcon, SocialIcon } from './icons';
import { SecurityFooter } from './SecurityFooter';
import { SocialButton } from './SocialButton';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'EnterPhone'>;

const schema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number.'),
});

type FormValues = z.infer<typeof schema>;

export function EnterPhoneScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      phone: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = ({ phone }: FormValues) => {
    setLoading(true);

    const normalizedPhone = normalizePhoneNumber(phone);

    navigation.navigate('VerifyOtp', {
      mode: route.params.mode,
      phone: normalizedPhone,
    });

    setLoading(false);
  };

  const onGooglePress = async () => {
    if (googleLoading || loading) {
      return;
    }

    setError(null);
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();

      if (result.cancelled) {
        return;
      }

      if (result.error) {
        setError(getLoginErrorMessage(result.error.message));
      }
    } catch (googleError) {
      setError(
        googleError instanceof Error ? googleError.message : 'Unable to sign in with Google.',
      );
    } finally {
      setGoogleLoading(false);
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
        <AuthBackButton onPress={() => navigation.goBack()} />
        <AuthBrand />
        <View style={styles.heading}>
          <Text style={authStyles.title}>
            {route.params.mode === 'signup' ? 'Sign up with phone' : 'Continue with phone'}
          </Text>
          <Text style={authStyles.subtitle}>
            Enter your mobile number and we&apos;ll send a one-time verification code.
          </Text>
        </View>
        <View style={styles.socials}>
          <SocialButton
            icon={<SocialIcon name="google" />}
            title={googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            onPress={() => void onGooglePress()}
          />
        </View>
        <AuthDivider />
        <View style={styles.form}>
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
                placeholder="0917 123 4567"
                value={value}
              />
            )}
          />
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <PrimaryButton loading={loading} title="Continue" onPress={handleSubmit(onSubmit)} />
          <PrimaryButton
            title={route.params.mode === 'signup' ? 'Sign up with email' : 'Login with email'}
            variant="secondary"
            onPress={() =>
              navigation.navigate(route.params.mode === 'signup' ? 'Signup' : 'Login')
            }
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
  form: {
    gap: 14,
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  socials: {
    gap: 14,
  },
});
