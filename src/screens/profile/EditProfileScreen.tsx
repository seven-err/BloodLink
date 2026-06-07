import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { BLOOD_TYPES } from '@/constants/bloodTypes';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import { updateProfile } from '@/services/supabase/profiles';
import type { BloodType } from '@/types/database';
import { formatRoleLabel } from '@/utils/profileDisplay';
import { sanitizeProfileError } from '@/utils/profileErrors';
import { profileStyles } from './styles';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

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

const editProfileSchema = z
  .object({
    address: z.string().trim().min(3, 'Address is required.'),
    birthdate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
      .refine(isValidBirthdate, 'Enter a valid past birthdate.'),
    bloodType: z.enum(BLOOD_TYPES as [BloodType, ...BloodType[]]).nullable(),
    fullName: z.string().trim().min(2, 'Name is required.'),
    weightKg: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.weightKg && !/^\d+(\.\d{1,2})?$/.test(value.weightKg)) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a valid weight in kilograms.',
        path: ['weightKg'],
      });
    }
  });

const donorEditProfileSchema = editProfileSchema.superRefine((value, context) => {
  if (!value.bloodType) {
    context.addIssue({
      code: 'custom',
      message: 'Blood type is required for donors.',
      path: ['bloodType'],
    });
  }
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function EditProfileScreen({ navigation }: Props) {
  const { profile, refreshProfile, session } = useAuth();
  const isDonor = profile?.role === 'donor';
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  });
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    defaultValues: {
      address: profile?.address ?? '',
      birthdate: profile?.birthdate ?? '',
      bloodType: profile?.blood_type ?? null,
      fullName: profile?.full_name ?? '',
      weightKg:
        profile?.weight_kg !== null && profile?.weight_kg !== undefined
          ? String(profile.weight_kg)
          : '',
    },
    resolver: zodResolver(isDonor ? donorEditProfileSchema : editProfileSchema),
  });
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
      weightKg:
        profile?.weight_kg !== null && profile?.weight_kg !== undefined
          ? String(profile.weight_kg)
          : '',
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

  const onSubmit = async (values: EditProfileFormValues) => {
    if (loading) {
      return;
    }

    if (!session?.user.id || !profile) {
      setError('You need to be signed in to update your profile.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const weightKg = values.weightKg.trim() ? Number(values.weightKg) : null;
      const { error: updateError } = await updateProfile({
        address: values.address,
        birthdate: values.birthdate,
        bloodType: values.bloodType,
        fullName: values.fullName,
        isDonor,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        userId: session.user.id,
        weightKg,
      });

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      setSuccessMessage('Profile updated successfully.');
      navigation.goBack();
    } catch (submitError) {
      setError(sanitizeProfileError(submitError, 'Unable to save your profile.'));
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={profileStyles.screen}>
        <View style={profileStyles.listContent}>
          <View style={profileStyles.card}>
            <Text style={profileStyles.title}>Profile unavailable</Text>
            <Text style={profileStyles.subtitle}>
              Sign in again or return to your profile to continue editing.
            </Text>
            <PrimaryButton title="Back to profile" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={profileStyles.listContent} style={profileStyles.screen}>
      <View style={profileStyles.card}>
        <Text style={profileStyles.eyebrow}>Edit profile</Text>
        <Text style={profileStyles.title}>Update your details</Text>
        <Text style={profileStyles.subtitle}>
          Only safe profile fields can be changed here. Role and account security settings are
          protected.
        </Text>
        <View style={profileStyles.detailRow}>
          <Text style={profileStyles.detailLabel}>Role</Text>
          <Text style={profileStyles.detailValue}>{formatRoleLabel(profile.role)}</Text>
        </View>
      </View>

      <View style={profileStyles.card}>
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

        {isDonor ? (
          <View style={recipientStyles.optionGroup}>
            <Text style={profileStyles.detailLabel}>Blood type</Text>
            <View style={recipientStyles.pillGrid}>
              {BLOOD_TYPES.map((bloodType) => (
                <Pressable
                  key={bloodType}
                  style={[
                    recipientStyles.pill,
                    selectedBloodType === bloodType ? recipientStyles.pillSelected : null,
                  ]}
                  onPress={() => setValue('bloodType', bloodType, { shouldValidate: true })}
                >
                  <Text
                    style={[
                      recipientStyles.pillText,
                      selectedBloodType === bloodType ? recipientStyles.pillTextSelected : null,
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

        {isDonor ? (
          <Controller
            control={control}
            name="weightKg"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormTextInput
                error={errors.weightKg?.message}
                keyboardType="decimal-pad"
                label="Weight (kg)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Optional"
                value={value}
              />
            )}
          />
        ) : null}

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
        {successMessage ? <Text style={authStyles.success}>{successMessage}</Text> : null}
        <PrimaryButton loading={loading} title="Save changes" onPress={handleSubmit(onSubmit)} />
      </View>
    </ScrollView>
  );
}
