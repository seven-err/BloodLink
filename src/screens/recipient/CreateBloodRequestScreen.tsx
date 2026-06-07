import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { BLOOD_TYPES } from '@/constants/bloodTypes';
import {
  BLOOD_REQUEST_URGENCIES,
  URGENCY_LABELS,
} from '@/constants/bloodRequestUrgency';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import { createBloodRequest } from '@/services/supabase/bloodRequests';
import type { BloodRequestUrgency, BloodType } from '@/types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateBloodRequest'>;

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const buildNeededAtIso = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
};

const bloodRequestSchema = z.object({
  address: z.string().trim().min(3, 'Address is required.'),
  bloodType: z.enum(BLOOD_TYPES as [BloodType, ...BloodType[]]),
  contactPhone: z
    .string()
    .trim()
    .min(7, 'Contact phone is required.')
    .max(20, 'Enter a valid phone number.'),
  hospitalName: z.string().trim().min(2, 'Hospital name is required.'),
  neededDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
    .refine(isValidDate, 'Enter a valid date.'),
  neededTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format (24-hour).')
    .refine(isValidTime, 'Enter a valid time.'),
  notes: z.string().trim().optional(),
  patientName: z.string().trim().min(2, 'Patient name is required.'),
  unitsNeeded: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Units needed must be a whole number.')
    .refine((value) => Number(value) > 0, 'Units needed must be at least 1.'),
  urgency: z.enum(BLOOD_REQUEST_URGENCIES as [BloodRequestUrgency, ...BloodRequestUrgency[]]),
});

type BloodRequestFormValues = z.infer<typeof bloodRequestSchema>;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function CreateBloodRequestScreen({ navigation }: Props) {
  const { session, profile } = useAuth();
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<BloodRequestFormValues>({
    defaultValues: {
      address: profile?.address ?? '',
      bloodType: BLOOD_TYPES[0],
      contactPhone: profile?.phone ?? '',
      hospitalName: '',
      neededDate: '',
      neededTime: '',
      notes: '',
      patientName: '',
      unitsNeeded: '1',
      urgency: 'normal',
    },
    resolver: zodResolver(bloodRequestSchema),
  });

  const selectedBloodType = watch('bloodType');
  const selectedUrgency = watch('urgency');
  const coordinateText =
    coordinates.latitude !== null && coordinates.longitude !== null
      ? `Saved coordinates: ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
      : null;

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

  const onSubmit = async (values: BloodRequestFormValues) => {
    if (loading) {
      return;
    }

    if (!session?.user.id) {
      setError('You need to be signed in to create a blood request.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: createError } = await createBloodRequest({
        address: values.address,
        bloodType: values.bloodType,
        contactPhone: values.contactPhone,
        hospitalName: values.hospitalName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        neededAt: buildNeededAtIso(values.neededDate, values.neededTime),
        notes: values.notes || null,
        patientName: values.patientName,
        requesterId: session.user.id,
        unitsNeeded: Number(values.unitsNeeded),
        urgency: values.urgency,
      });

      if (createError) {
        setError(createError.message);
        return;
      }

      if (!data) {
        setError('Unable to create blood request.');
        return;
      }

      navigation.replace('BloodRequestDetail', { requestId: data.id });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create blood request.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={recipientStyles.scrollContent}
      style={recipientStyles.screen}
    >
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Create blood request</Text>
        <Text style={authStyles.subtitle}>
          Share what donors need to know. Contact and patient details stay hidden until a
          donor is matched.
        </Text>

        <View style={recipientStyles.optionGroup}>
          <Text style={recipientStyles.detailLabel}>Blood type</Text>
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
                    selectedBloodType === bloodType
                      ? recipientStyles.pillTextSelected
                      : null,
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

        <Controller
          control={control}
          name="unitsNeeded"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.unitsNeeded?.message}
              keyboardType="number-pad"
              label="Units needed"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="1"
              value={value}
            />
          )}
        />

        <View style={recipientStyles.optionGroup}>
          <Text style={recipientStyles.detailLabel}>Urgency</Text>
          <View style={recipientStyles.pillGrid}>
            {BLOOD_REQUEST_URGENCIES.map((urgency) => (
              <Pressable
                key={urgency}
                style={[
                  recipientStyles.pill,
                  selectedUrgency === urgency ? recipientStyles.pillSelected : null,
                ]}
                onPress={() => setValue('urgency', urgency, { shouldValidate: true })}
              >
                <Text
                  style={[
                    recipientStyles.pillText,
                    selectedUrgency === urgency ? recipientStyles.pillTextSelected : null,
                  ]}
                >
                  {URGENCY_LABELS[urgency]}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.urgency?.message ? (
            <Text style={authStyles.error}>{errors.urgency.message}</Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="neededDate"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.neededDate?.message}
              keyboardType="numbers-and-punctuation"
              label="Needed by (date)"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="neededTime"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.neededTime?.message}
              keyboardType="numbers-and-punctuation"
              label="Needed by (time)"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="HH:mm"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="patientName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.patientName?.message}
              label="Patient name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Patient full name"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="hospitalName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.hospitalName?.message}
              label="Hospital name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Hospital or clinic"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="contactPhone"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.contactPhone?.message}
              keyboardType="phone-pad"
              label="Contact phone"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="+63 912 345 6789"
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

        <Controller
          control={control}
          name="notes"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormTextInput
              error={errors.notes?.message}
              label="Notes (optional)"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Additional instructions for matched donors"
              value={value}
            />
          )}
        />

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        <PrimaryButton
          loading={loading}
          title="Submit blood request"
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </ScrollView>
  );
}
