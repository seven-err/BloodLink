import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import {
  getLatestDonorVerification,
  isDonorVerificationActive,
  setDonorAvailability,
  type DonorVerificationSummary,
} from '@/services/supabase/profiles';
import {
  formatAvailability,
  formatDate,
  formatDateTime,
  formatRoleLabel,
  formatVerificationStatus,
  formatWeight,
} from '@/utils/profileDisplay';
import { sanitizeProfileError } from '@/utils/profileErrors';
import { profileStyles } from './styles';

type Props = NativeStackScreenProps<AppStackParamList, 'AppProfile'>;

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={profileStyles.detailRow}>
      <Text style={profileStyles.detailLabel}>{label}</Text>
      <Text style={profileStyles.detailValue}>{value}</Text>
    </View>
  );
}

export function UserProfileScreen({ navigation }: Props) {
  const { profile, refreshProfile, session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<DonorVerificationSummary>(null);
  const [verificationActive, setVerificationActive] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilitySuccess, setAvailabilitySuccess] = useState<string | null>(null);

  const isDonor = profile?.role === 'donor';
  const email = session?.user.email?.trim() || null;
  const phone = profile?.phone?.trim() || session?.user.phone?.trim() || null;

  const loadDonorDetails = useCallback(async () => {
    if (!session?.user.id || profile?.role !== 'donor') {
      setVerification(null);
      setVerificationActive(false);
      return;
    }

    setLoadingDetails(true);
    setError(null);

    try {
      const [verificationResult, activeResult] = await Promise.all([
        getLatestDonorVerification(session.user.id),
        isDonorVerificationActive(session.user.id),
      ]);

      if (verificationResult.error) {
        throw verificationResult.error;
      }

      if (activeResult.error) {
        throw activeResult.error;
      }

      setVerification(verificationResult.data);
      setVerificationActive(Boolean(activeResult.data));
    } catch (loadError) {
      setError(sanitizeProfileError(loadError, 'Unable to load donor status.'));
    } finally {
      setLoadingDetails(false);
    }
  }, [profile?.role, session?.user.id]);

  const reloadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      }

      setError(null);

      try {
        await refreshProfile();
        await loadDonorDetails();
      } catch (loadError) {
        setError(sanitizeProfileError(loadError, 'Unable to refresh your profile.'));
      } finally {
        setRefreshing(false);
      }
    },
    [loadDonorDetails, refreshProfile],
  );

  useFocusEffect(
    useCallback(() => {
      void reloadProfile();
    }, [reloadProfile]),
  );

  const handleAvailabilityToggle = async (nextValue: boolean) => {
    if (!session?.user.id || !isDonor || availabilityLoading) {
      return;
    }

    if (nextValue && !verificationActive) {
      setAvailabilityError('You must be verified before turning on availability.');
      setAvailabilitySuccess(null);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailabilitySuccess(null);

    try {
      const { error: updateError } = await setDonorAvailability(session.user.id, nextValue);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      setAvailabilitySuccess(
        nextValue ? 'You are now available for nearby requests.' : 'You are now marked unavailable.',
      );
    } catch (toggleError) {
      setAvailabilityError(
        sanitizeProfileError(toggleError, 'Unable to update availability. Please try again.'),
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={profileStyles.screen}>
        <View style={profileStyles.listContent}>
          <View style={profileStyles.card}>
            <Text style={profileStyles.eyebrow}>Profile</Text>
            <Text style={profileStyles.title}>Profile unavailable</Text>
            <Text style={profileStyles.subtitle}>
              We could not load your profile details right now.
            </Text>
            {error ? <Text style={authStyles.error}>{error}</Text> : null}
            <PrimaryButton title="Try again" onPress={() => void reloadProfile()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={profileStyles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void reloadProfile(true)} />
      }
      style={profileStyles.screen}
    >
      <View style={profileStyles.card}>
        <Text style={profileStyles.eyebrow}>Your profile</Text>
        <Text style={profileStyles.title}>{profile.full_name?.trim() || 'BloodLink user'}</Text>
        <Text style={profileStyles.subtitle}>
          Review your account details and manage donor availability.
        </Text>
      </View>

      <View style={profileStyles.card}>
        <Text style={profileStyles.sectionTitle}>Account details</Text>
        <ProfileDetailRow label="Role" value={formatRoleLabel(profile.role)} />
        {email ? <ProfileDetailRow label="Email" value={email} /> : null}
        {phone ? <ProfileDetailRow label="Phone" value={phone} /> : null}
        <ProfileDetailRow label="Birthdate" value={formatDate(profile.birthdate)} />
        <ProfileDetailRow label="Address" value={profile.address?.trim() || 'Not set'} />
      </View>

      {isDonor ? (
        <View style={profileStyles.card}>
          <Text style={profileStyles.sectionTitle}>Donor details</Text>
          <ProfileDetailRow label="Blood type" value={profile.blood_type ?? 'Not set'} />
          <ProfileDetailRow
            label="Last donation"
            value={formatDateTime(profile.last_donation_at)}
          />
          <ProfileDetailRow label="Weight" value={formatWeight(profile.weight_kg)} />
          <ProfileDetailRow
            label="Verification"
            value={formatVerificationStatus(verification?.status)}
          />
          {loadingDetails ? <ActivityIndicator color="#b91c1c" /> : null}
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
        </View>
      ) : null}

      {isDonor ? (
        <View style={profileStyles.availabilityCard}>
          <View style={profileStyles.availabilityRow}>
            <View style={{ flex: 1, gap: 4, paddingRight: 12 }}>
              <Text style={profileStyles.sectionTitle}>Availability</Text>
              <Text style={profileStyles.helper}>{formatAvailability(profile.is_available)}</Text>
            </View>
            <Switch
              disabled={availabilityLoading || (profile.is_available === false && !verificationActive)}
              onValueChange={(value) => {
                void handleAvailabilityToggle(value);
              }}
              thumbColor={profile.is_available ? '#fff' : '#f9fafb'}
              trackColor={{ false: '#d1d5db', true: '#b91c1c' }}
              value={profile.is_available}
            />
          </View>
          {!verificationActive ? (
            <Text style={profileStyles.helper}>
              Complete donor verification before you can appear in nearby request matching.
            </Text>
          ) : null}
          {availabilityError ? <Text style={authStyles.error}>{availabilityError}</Text> : null}
          {availabilitySuccess ? <Text style={authStyles.success}>{availabilitySuccess}</Text> : null}
        </View>
      ) : null}

      <View style={profileStyles.actions}>
        <PrimaryButton title="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <PrimaryButton
          title="Settings"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </ScrollView>
  );
}
