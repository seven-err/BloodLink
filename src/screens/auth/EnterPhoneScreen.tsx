import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import type { AuthStackParamList } from '@/navigation/types';
import { requestPhoneOtp } from '@/services/supabase/auth';
import { normalizePhoneNumber } from '@/utils/phone';
import { AuthBrand } from './AuthBrand';
import { AuthDivider } from './AuthDivider';
import { AuthIcon, MutedIcon } from './icons';
import { SecurityFooter } from './SecurityFooter';
import { SocialButton } from './SocialButton';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'EnterPhone'>;

const schema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number.'),
});

const getPhoneOtpErrorMessage = (message: string) => {
  if (message.toLowerCase().includes('unsupported phone provider')) {
    return 'Phone OTP is not enabled yet. You can continue with Google, Apple, or email instead.';
  }

  return message;
};

type FormValues = z.infer<typeof schema>;

export function EnterPhoneScreen({ navigation, route }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const onSubmit = async ({ phone }: FormValues) => {
    setError(null);
    setLoading(true);

    const normalizedPhone = normalizePhoneNumber(phone);
    const { error: otpError } = await requestPhoneOtp(normalizedPhone);

    setLoading(false);

    if (otpError) {
      setError(getPhoneOtpErrorMessage(otpError.message));
      return;
    }

    navigation.navigate('VerifyOtp', {
      mode: route.params.mode,
      phone: normalizedPhone,
    });
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
        <View style={styles.card}>
          <Text style={authStyles.title}>
            {route.params.mode === 'signup' ? 'Create account' : 'Phone login'}
          </Text>
          <Text style={authStyles.subtitle}>
            Enter your mobile number and we'll send a one-time verification code.
          </Text>
          <View style={styles.socials}>
            <SocialButton icon={<MutedIcon name="apple" />} title="Continue with Apple" />
            <SocialButton icon={<AuthIcon name="google" />} title="Continue with Google" />
          </View>
          <AuthDivider />
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
          <PrimaryButton
            loading={loading}
            title="Send OTP"
            onPress={handleSubmit(onSubmit)}
          />
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
  card: {
    gap: 18,
  },
  content: {
    flexGrow: 1,
    gap: 28,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 44,
  },
  screen: {
    backgroundColor: '#fafafa',
    flex: 1,
  },
  socials: {
    gap: 14,
  },
});
