import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { BloodTypeSelector } from '@/components/forms/BloodTypeSelector';
import { FormUrgencySelector } from '@/components/forms/FormUrgencySelector';
import { MedicalDocumentUploadField } from '@/components/forms/MedicalDocumentUploadField';
import { RequestFormField } from '@/components/forms/RequestFormField';
import { BLOOD_TYPES } from '@/constants/bloodTypes';
import { mapFormUrgencyToDb } from '@/constants/createBloodRequestForm';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';
import { createBloodRequest } from '@/services/supabase/bloodRequests';
import {
  uploadBloodRequestAttachment,
  type LocalDocument,
} from '@/services/supabase/storageUpload';
import type { BloodType } from '@/types/database';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateBloodRequest'>;

const getDefaultNeededAt = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString();
};

const bloodRequestSchema = z.object({
  address: z.string().trim().min(3, 'Location is required.'),
  bloodType: z.enum(BLOOD_TYPES as [BloodType, ...BloodType[]]),
  contactPerson: z
    .string()
    .trim()
    .min(3, 'Contact person details are required.'),
  hospitalName: z.string().trim().min(2, 'Hospital name is required.'),
  notes: z.string().trim().optional(),
  patientName: z.string().trim().min(2, 'Patient name or label is required.'),
  unitsNeeded: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Units needed must be a whole number.')
    .refine((value) => Number(value) > 0, 'Units needed must be at least 1.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

type BloodRequestFormValues = z.infer<typeof bloodRequestSchema>;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function CreateBloodRequestScreen({ navigation, route }: Props) {
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  });
  const [document, setDocument] = useState<LocalDocument | null>(null);
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
      bloodType: route.params?.bloodType ?? profile?.blood_type ?? BLOOD_TYPES[0],
      contactPerson: profile?.phone ?? '',
      hospitalName: '',
      notes: '',
      patientName: '',
      unitsNeeded: '1',
      urgencyLevel: 'medium',
    },
    resolver: zodResolver(bloodRequestSchema),
  });

  const selectedBloodType = watch('bloodType');
  const selectedUrgencyLevel = watch('urgencyLevel');

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
            ? 'Location permission is disabled. Enter an address manually.'
            : 'Location permission denied. Enter an address manually.',
        );
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setLocationMessage('Location services are off. Enter an address manually.');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
      setLocationMessage('Current location captured. Add an address for donors if needed.');
    } catch {
      setLocationMessage('Unable to capture location. Enter an address manually.');
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
      let attachmentPath: string | null = null;

      if (document) {
        attachmentPath = await uploadBloodRequestAttachment(session.user.id, document);
      }

      const { data, error: createError } = await createBloodRequest({
        address: values.address,
        attachmentPath,
        bloodType: values.bloodType,
        contactPhone: values.contactPerson,
        hospitalName: values.hospitalName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        neededAt: getDefaultNeededAt(),
        notes: values.notes || null,
        patientName: values.patientName,
        requesterId: session.user.id,
        unitsNeeded: Number(values.unitsNeeded),
        urgency: mapFormUrgencyToDb(values.urgencyLevel),
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={createBloodRequestStyles.screen}
    >
      <View style={[createBloodRequestStyles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={colors.foreground} size={22} />
        </Pressable>
        <Text style={createBloodRequestStyles.headerTitle}>Create Blood Request</Text>
      </View>

      <ScrollView
        contentContainerStyle={createBloodRequestStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="patientName"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.patientName?.message}
              label="Patient Name / Request Label"
              placeholder="Enter patient name or label"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        <BloodTypeSelector
          error={errors.bloodType?.message}
          value={selectedBloodType}
          onChange={(bloodType) =>
            setValue('bloodType', bloodType, { shouldValidate: true })
          }
        />

        <Controller
          control={control}
          name="unitsNeeded"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.unitsNeeded?.message}
              keyboardType="number-pad"
              label="Number of Units"
              placeholder="Enter number of units"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="hospitalName"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.hospitalName?.message}
              label="Hospital / Medical Facility"
              placeholder="Enter hospital name"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.address?.message}
              label="Location"
              leftIcon={
                <Pressable
                  accessibilityLabel="Use current location"
                  accessibilityRole="button"
                  disabled={locating}
                  style={createBloodRequestStyles.locationIcon}
                  onPress={() => void captureLocation()}
                >
                  {locating ? (
                    <ActivityIndicator color={colors.mutedLight} size="small" />
                  ) : (
                    <MapPin color={colors.mutedLight} size={18} />
                  )}
                </Pressable>
              }
              placeholder="Enter address or use current location"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
        {locationMessage ? (
          <Text style={createBloodRequestStyles.helperText}>{locationMessage}</Text>
        ) : null}

        <FormUrgencySelector
          error={errors.urgencyLevel?.message}
          value={selectedUrgencyLevel}
          onChange={(urgencyLevel) =>
            setValue('urgencyLevel', urgencyLevel, { shouldValidate: true })
          }
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.notes?.message}
              label="Medical Note (Optional)"
              multiline
              placeholder="Add any relevant medical information"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="contactPerson"
          render={({ field: { onBlur, onChange, value } }) => (
            <RequestFormField
              error={errors.contactPerson?.message}
              label="Contact Person"
              placeholder="Name and phone number"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />

        <MedicalDocumentUploadField document={document} onChange={setDocument} />

        {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={[createBloodRequestStyles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          style={({ pressed }) => [
            createBloodRequestStyles.submitButton,
            loading ? createBloodRequestStyles.submitButtonDisabled : null,
            pressed && !loading ? createBloodRequestStyles.submitButtonPressed : null,
          ]}
          onPress={handleSubmit(onSubmit)}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={createBloodRequestStyles.submitButtonText}>Submit Request</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
