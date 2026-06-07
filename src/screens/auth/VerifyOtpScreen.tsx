import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import type { AuthStackParamList } from '@/navigation/types';
import { requestPhoneOtp, verifyPhoneOtp } from '@/services/supabase/auth';
import { AuthBrand } from './AuthBrand';
import { AuthIcon } from './icons';
import { SecurityFooter } from './SecurityFooter';
import { authStyles } from './styles';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

const schema = z.object({
  token: z.string().min(4, 'Enter the OTP code.'),
});

const getVerifyOtpErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes('expired') || normalized.includes('invalid')) {
    return 'That code is invalid or has expired. Request a new code and try again.';
  }

  return message;
};

const getPhoneOtpErrorMessage = (message: string) => {
  if (message.toLowerCase().includes('unsupported phone provider')) {
    return 'Phone OTP is not enabled yet. You can continue with Google, Apple, or email instead.';
  }

  return message;
};

type FormValues = z.infer<typeof schema>;

export function VerifyOtpScreen({ route }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      token: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ token }: FormValues) => {
    setError(null);
    setResendMessage(null);
    setLoading(true);

    try {
      const { error: verifyError } = await verifyPhoneOtp(route.params.phone, token);

      if (verifyError) {
        setError(getVerifyOtpErrorMessage(verifyError.message));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setResendMessage(null);
    setResending(true);

    try {
      const { error: resendError } = await requestPhoneOtp(route.params.phone);

      if (resendError) {
        setError(getPhoneOtpErrorMessage(resendError.message));
        return;
      }

      setResendMessage(`A new code was sent to ${route.params.phone}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to resend the code.');
    } finally {
      setResending(false);
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
        <View style={styles.card}>
          <Text style={authStyles.title}>Verify OTP</Text>
          <Text style={authStyles.subtitle}>
            Enter the code sent to {route.params.phone}.
          </Text>
          <Controller
            control={control}
            name="token"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                error={errors.token?.message}
                keyboardType="number-pad"
                label=""
                leftIcon={<AuthIcon name="email" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="123456"
                value={value}
              />
            )}
          />
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          {resendMessage ? <Text style={authStyles.helper}>{resendMessage}</Text> : null}
          <PrimaryButton
            loading={loading}
            title={route.params.mode === 'signup' ? 'Verify and continue' : 'Verify login'}
            onPress={handleSubmit(onSubmit)}
          />
          <PrimaryButton
            loading={resending}
            title="Resend code"
            variant="secondary"
            onPress={onResend}
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
});
