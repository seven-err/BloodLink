import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Skeleton } from '@/components/common/Skeleton';
import { BloodTypeSelector } from '@/components/forms/BloodTypeSelector';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { RequestFormField } from '@/components/forms/RequestFormField';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import type { AppStackParamList } from '@/navigation/types';
import { getHighAccuracyPosition } from '@/services/location/getHighAccuracyPosition';
import { updateProfile } from '@/services/supabase/profiles';
import {
  donorEditProfileSchema,
  editProfileSchema,
  type EditProfileFormValues,
} from '@/utils/editProfileValidation';
import { MAX_DONOR_WEIGHT_KG, MIN_DONOR_WEIGHT_KG } from '@/utils/donorEligibility';
import { formatGeocodedAddress } from '@/utils/locationAddress';
import { formatRoleLabel } from '@/utils/profileDisplay';
import { sanitizeProfileError } from '@/utils/profileErrors';
import { appCache } from '@/utils/appCache';
import { editProfileStyles } from './editProfileStyles';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

function EditProfileSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={editProfileStyles.section}>
      <Text style={editProfileStyles.sectionTitle}>{title}</Text>
      <View style={editProfileStyles.sectionCard}>{children}</View>
    </View>
  );
}

function EditProfileSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={editProfileStyles.screen}>
      <View style={[editProfileStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton borderRadius={8} height={22} width={22} />
        <Skeleton borderRadius={8} height={20} width={120} />
      </View>
      <View style={editProfileStyles.scrollContent}>
        <Skeleton borderRadius={999} height={32} width={96} />
        <View style={editProfileStyles.skeletonCard}>
          <Skeleton borderRadius={8} height={48} width="100%" />
          <Skeleton borderRadius={8} height={48} width="100%" />
        </View>
        <View style={editProfileStyles.skeletonCard}>
          <Skeleton borderRadius={8} height={48} width="100%" />
          <Skeleton borderRadius={8} height={110} width="100%" />
        </View>
      </View>
    </View>
  );
}

function ContactInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={editProfileStyles.contactRow}>
      <Text style={editProfileStyles.contactLabel}>{label}</Text>
      <Text style={editProfileStyles.contactValue}>{value}</Text>
    </View>
  );
}

export function EditProfileScreen({ navigation }: Props) {
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const { profile, profileLoading, refreshProfile, session } = useAuth();
  const isDonor = profile?.role === 'donor';
  const email = session?.user.email?.trim() || null;
  const phone = profile?.phone?.trim() || session?.user.phone?.trim() || null;

  const initialCoordinates = useMemo<Coordinates>(
    () => ({
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    }),
    [profile?.latitude, profile?.longitude],
  );

  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
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
    formState: { errors, isDirty },
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
  const hasCapturedLocation = coordinates.latitude !== null && coordinates.longitude !== null;
  const coordinatesDirty =
    coordinates.latitude !== initialCoordinates.latitude ||
    coordinates.longitude !== initialCoordinates.longitude;
  const hasUnsavedChanges = isDirty || coordinatesDirty;
  const { allowExit } = useUnsavedChangesGuard({ enabled: hasUnsavedChanges });

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
            ? 'Location permission is disabled. Enable it in settings or enter an address manually.'
            : 'Location permission denied. Enter an address manually.',
        );
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setLocationMessage('Location services are off. Enter an address manually.');
        return;
      }

      const currentPosition = await getHighAccuracyPosition();

      const nextCoordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setCoordinates(nextCoordinates);

      const geocodedPlaces = await Location.reverseGeocodeAsync(nextCoordinates);
      const formattedAddress = geocodedPlaces[0]
        ? formatGeocodedAddress(geocodedPlaces[0])
        : null;

      if (formattedAddress) {
        setValue('address', formattedAddress, { shouldDirty: true, shouldValidate: true });
        setLocationMessage('Current location captured and address updated.');
      } else {
        setLocationMessage('Current location captured. Add an address if needed.');
      }
    } catch {
      setLocationMessage('Unable to capture location. Enter an address manually.');
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

      appCache.invalidate(`profile:dashboard:${session.user.id}`);
      await refreshProfile();
      allowExit();
      navigation.goBack();
    } catch (submitError) {
      setError(sanitizeProfileError(submitError, 'Unable to save your profile.'));
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading && !profile) {
    return <EditProfileSkeleton topInset={topInset} />;
  }

  if (!profile) {
    return (
      <View style={editProfileStyles.screen}>
        <View style={[editProfileStyles.header, { paddingTop: topInset + 8 }]}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={colors.foreground} size={22} />
          </Pressable>
          <Text style={editProfileStyles.headerTitle}>Edit Profile</Text>
        </View>
        <View style={editProfileStyles.scrollContent}>
          <View style={editProfileStyles.unavailableCard}>
            <Text style={editProfileStyles.unavailableTitle}>Profile unavailable</Text>
            <Text style={editProfileStyles.subtitle}>
              Sign in again or return to your profile to continue editing.
            </Text>
            <PrimaryButton title="Back to profile" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={editProfileStyles.screen}
    >
      <View style={[editProfileStyles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={colors.foreground} size={22} />
        </Pressable>
        <Text style={editProfileStyles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={editProfileStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={editProfileStyles.roleBadge}>
          <Text style={editProfileStyles.roleBadgeText}>{formatRoleLabel(profile.role)}</Text>
        </View>

        <EditProfileSection title="Personal Information">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onBlur, onChange, value } }) => (
              <RequestFormField
                error={errors.fullName?.message}
                label="Full Name"
                placeholder="Enter your full name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="birthdate"
            render={({ field: { onChange, value } }) => (
              <FormDatePicker
                error={errors.birthdate?.message}
                label="Birthdate"
                value={value}
                onChange={onChange}
              />
            )}
          />
        </EditProfileSection>

        {isDonor ? (
          <EditProfileSection title="Donor Details">
            <BloodTypeSelector
              error={errors.bloodType?.message}
              label="Blood Type"
              value={selectedBloodType}
              onChange={(bloodType) =>
                setValue('bloodType', bloodType, { shouldDirty: true, shouldValidate: true })
              }
            />

            <Controller
              control={control}
              name="weightKg"
              render={({ field: { onBlur, onChange, value } }) => (
                <RequestFormField
                  error={errors.weightKg?.message}
                  keyboardType="decimal-pad"
                  label="Weight (kg)"
                  placeholder={`${MIN_DONOR_WEIGHT_KG}–${MAX_DONOR_WEIGHT_KG} kg`}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            <Text style={editProfileStyles.helperText}>
              Donors must weigh at least {MIN_DONOR_WEIGHT_KG} kg to donate safely.
            </Text>
          </EditProfileSection>
        ) : null}

        <EditProfileSection title="Location">
          <Controller
            control={control}
            name="address"
            render={({ field: { onBlur, onChange, value } }) => (
              <RequestFormField
                error={errors.address?.message}
                label="Address"
                leftIcon={
                  <Pressable
                    accessibilityLabel="Use current location"
                    accessibilityRole="button"
                    disabled={locating}
                    style={editProfileStyles.locationIcon}
                    onPress={() => void captureLocation()}
                  >
                    {locating ? (
                      <ActivityIndicator color={colors.mutedLight} size="small" />
                    ) : (
                      <MapPin color={colors.mutedLight} size={18} />
                    )}
                  </Pressable>
                }
                multiline
                placeholder="City, province, or nearby landmark"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />

          {hasCapturedLocation ? (
            <View style={editProfileStyles.statusPill}>
              <Text style={editProfileStyles.statusPillText}>GPS location saved</Text>
            </View>
          ) : null}
          {locationMessage ? (
            <Text style={editProfileStyles.helperText}>{locationMessage}</Text>
          ) : null}
        </EditProfileSection>

        <EditProfileSection title="Contact">
          {email ? <ContactInfoRow label="Email" value={email} /> : null}
          {phone ? <ContactInfoRow label="Phone" value={phone} /> : null}
          {!email && !phone ? (
            <Text style={editProfileStyles.helperText}>No contact details on file yet.</Text>
          ) : null}
          <Text style={editProfileStyles.helperText}>
            Email and phone are managed through your account settings.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Text style={editProfileStyles.contactLink}>Open account settings</Text>
          </Pressable>
        </EditProfileSection>

        {error ? <Text style={editProfileStyles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={[editProfileStyles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          style={({ pressed }) => [
            editProfileStyles.submitButton,
            loading ? editProfileStyles.submitButtonDisabled : null,
            pressed && !loading ? editProfileStyles.submitButtonPressed : null,
          ]}
          onPress={handleSubmit(onSubmit)}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={editProfileStyles.submitButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
