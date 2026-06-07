import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { BLOOD_TYPES } from '@/constants/bloodTypes';
import { useAuth } from '@/context/AuthContext';
import { completeProfile } from '@/services/supabase/profiles';
import type { BloodType, UserRole } from '@/types/database';
import { authStyles } from './styles';

const isValidBirthdate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
};

const profileSchema = z
  .object({
    address: z.string().trim().min(3, 'Address is required.'),
    birthdate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
      .refine(isValidBirthdate, 'Enter a valid past birthdate.'),
    bloodType: z.enum(BLOOD_TYPES as [BloodType, ...BloodType[]]).nullable(),
    fullName: z.string().trim().min(2, 'Name is required.'),
    role: z.enum(['donor', 'recipient']),
  })
  .superRefine((value, context) => {
    if (value.role === 'donor' && !value.bloodType) {
      context.addIssue({
        code: 'custom',
        message: 'Blood type is required for donors.',
        path: ['bloodType'],
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function ProfileCompletionScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  });
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      address: profile?.address ?? '',
      birthdate: profile?.birthdate ?? '',
      bloodType: profile?.blood_type ?? null,
      fullName: profile?.full_name ?? '',
      role: profile?.role === 'donor' ? 'donor' : 'recipient',
    },
    resolver: zodResolver(profileSchema),
  });
  const selectedRole = watch('role');
  const selectedBloodType = watch('bloodType');
  const coordinateText =
    coordinates.latitude !== null && coordinates.longitude !== null
      ? `Saved coordinates: ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
      : null;

  useEffect(() => {
    reset({
      address: profile?.address ?? '',
      birthdate: profile?.birthdate ?? '',
      bloodType: profile?.blood_type ?? null,
      fullName: profile?.full_name ?? '',
      role: profile?.role === 'donor' ? 'donor' : 'recipient',
    });
    setCoordinates({
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    });
  }, [profile, reset]);

  const captureLocation = async () => {
    if (locating) {
      return;
    }

    setLocationMessage(null);
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationMessage(
          permission.canAskAgain === false
            ? 'Location permission is disabled. Enable it in settings or continue with address only.'
            : 'Location permission denied. You can continue with address only.',
        );
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setLocationMessage('Location services are off. Enable them or continue with address only.');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
      setLocationMessage('Current location captured.');
    } catch {
      setLocationMessage('Unable to capture location. You can continue with address only.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (loading) {
      return;
    }

    if (!session?.user.id) {
      setError('You need to be signed in to complete your profile.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: profileError } = await completeProfile({
        address: values.address,
        birthdate: values.birthdate,
        bloodType: values.bloodType,
        fullName: values.fullName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        role: values.role,
        userId: session.user.id,
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      await refreshProfile();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: Extract<UserRole, 'donor' | 'recipient'>) => {
    setValue('role', role, { shouldValidate: true });

    if (role === 'recipient') {
      setValue('bloodType', null, { shouldValidate: true });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Complete profile</Text>
        <Text style={authStyles.subtitle}>
          Tell us the essentials so BloodLink can match requests safely.
        </Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.fullName?.message}
              label="Name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Juan Dela Cruz"
              value={value}
            />
          )}
        />
        <View style={styles.optionGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.row}>
            {(['donor', 'recipient'] as const).map((role) => (
              <Pressable
                key={role}
                style={[styles.pill, selectedRole === role ? styles.pillSelected : null]}
                onPress={() => selectRole(role)}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedRole === role ? styles.pillTextSelected : null,
                  ]}
                >
                  {role === 'donor' ? 'Donor' : 'Recipient'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {selectedRole === 'donor' ? (
          <View style={styles.optionGroup}>
            <Text style={styles.label}>Blood Type</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.map((bloodType) => (
                <Pressable
                  key={bloodType}
                  style={[
                    styles.bloodPill,
                    selectedBloodType === bloodType ? styles.pillSelected : null,
                  ]}
                  onPress={() => setValue('bloodType', bloodType, { shouldValidate: true })}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedBloodType === bloodType ? styles.pillTextSelected : null,
                    ]}
                  >
                    {bloodType}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.bloodType?.message ? (
              <Text style={authStyles.error}>{errors.bloodType.message}</Text>
            ) : null}
          </View>
        ) : null}
        <Controller
          control={control}
          name="birthdate"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.birthdate?.message}
              keyboardType="numbers-and-punctuation"
              label="Birthdate"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.address?.message}
              label="Address"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="City, province, nearby landmark"
              value={value}
            />
          )}
        />
        <PrimaryButton
          loading={locating}
          title="Use current location"
          variant="secondary"
          onPress={captureLocation}
        />
        {locationMessage ? <Text style={authStyles.helper}>{locationMessage}</Text> : null}
        {coordinateText ? <Text style={authStyles.helper}>{coordinateText}</Text> : null}
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <PrimaryButton
          loading={loading}
          title="Save profile"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodPill: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    minWidth: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  optionGroup: {
    gap: 8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillSelected: {
    backgroundColor: '#b91c1c',
  },
  pillText: {
    color: '#374151',
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  scroll: {
    backgroundColor: '#fef2f2',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
