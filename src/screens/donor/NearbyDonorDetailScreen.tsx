import { useCallback, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, Users } from 'lucide-react-native';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { DonorVerificationBadge } from '@/components/donor/DonorVerificationBadge';
import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { nearbyDonorDetailStyles } from '@/screens/donor/nearbyDonorDetailStyles';
import { getMyBloodRequests } from '@/services/supabase/bloodRequests';
import { isDonorCompatibleWithRecipient } from '@/utils/bloodTypeCompatibility';
import { formatLastDonationLabel } from '@/utils/donorMapDisplay';
import { formatDistance } from '@/utils/travelMetrics';

type Props = NativeStackScreenProps<AppStackParamList, 'NearbyDonorDetail'>;

export function NearbyDonorDetailScreen({ navigation, route }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const { donor } = route.params;
  const [coordinating, setCoordinating] = useState(false);
  const verificationStatus = donor.isVerified ? 'verified' : 'pending';
  const isRecipient = profile?.role === 'recipient';
  const isDonor = profile?.role === 'donor';

  const donorCompatibleWithRecipient =
    profile?.blood_type != null
      ? isDonorCompatibleWithRecipient(donor.bloodType, profile.blood_type)
      : true;

  const handleRecipientCoordinate = useCallback(async () => {
    if (!session?.user.id || coordinating) {
      return;
    }

    if (profile?.blood_type && !donorCompatibleWithRecipient) {
      Alert.alert(
        'Blood type mismatch',
        `${donor.fullName} (${donor.bloodType}) is not compatible with your blood type (${profile.blood_type}). Browse the map for other donors.`,
      );
      return;
    }

    setCoordinating(true);

    const { data: requests, error } = await getMyBloodRequests(session.user.id);

    if (error) {
      Alert.alert('Unable to load requests', error.message);
      setCoordinating(false);
      return;
    }

    const openCompatibleRequests = (requests ?? []).filter(
      (request) =>
        request.status === 'open' &&
        isDonorCompatibleWithRecipient(donor.bloodType, request.blood_type),
    );

    if (openCompatibleRequests.length === 1) {
      navigation.navigate('BloodRequestDetail', { requestId: openCompatibleRequests[0].id });
      setCoordinating(false);
      return;
    }

    if (openCompatibleRequests.length > 1) {
      Alert.alert(
        'Open requests found',
        'You already have open blood requests that this donor could respond to. Open one to review responses when they arrive.',
        [
          { style: 'cancel', text: 'Stay here' },
          {
            text: 'View my requests',
            onPress: () => navigation.navigate('MyBloodRequests'),
          },
        ],
      );
      setCoordinating(false);
      return;
    }

    navigation.navigate('CreateBloodRequest', {
      bloodType: profile?.blood_type ?? undefined,
    });
    setCoordinating(false);
  }, [
    coordinating,
    donor.bloodType,
    donor.fullName,
    donorCompatibleWithRecipient,
    navigation,
    profile?.blood_type,
    session?.user.id,
  ]);

  const handleDonorBrowseRequests = () => {
    navigation.navigate('AppTabs', { screen: 'Requests' });
  };

  return (
    <View style={nearbyDonorDetailStyles.screen}>
      <SettingsScreenHeader title="Donor Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={nearbyDonorDetailStyles.scrollContent}>
        <View style={[nearbyDonorDetailStyles.heroCard, { marginTop: topInset > 0 ? 0 : 8 }]}>
          <View style={nearbyDonorDetailStyles.heroTop}>
            <View style={nearbyDonorDetailStyles.avatarShell}>
              <Text style={nearbyDonorDetailStyles.avatarText}>
                {donor.fullName
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0] ?? '')
                  .join('')
                  .toUpperCase() || 'BL'}
              </Text>
            </View>
            <View style={nearbyDonorDetailStyles.heroCopy}>
              <View style={nearbyDonorDetailStyles.nameRow}>
                <Text numberOfLines={1} style={nearbyDonorDetailStyles.name}>
                  {donor.fullName}
                </Text>
                <DonorVerificationBadge status={verificationStatus} />
              </View>
            </View>
          </View>

          <View style={nearbyDonorDetailStyles.badgeRow}>
            <BloodTypeBadge bloodType={donor.bloodType} size="lg" variant="solid" />
            <View
              style={[
                nearbyDonorDetailStyles.statusPill,
                donor.isAvailable
                  ? nearbyDonorDetailStyles.statusPillAvailable
                  : nearbyDonorDetailStyles.statusPillUnavailable,
              ]}
            >
              <Text
                style={[
                  nearbyDonorDetailStyles.statusPillText,
                  donor.isAvailable
                    ? nearbyDonorDetailStyles.statusPillTextAvailable
                    : nearbyDonorDetailStyles.statusPillTextUnavailable,
                ]}
              >
                {donor.isAvailable ? 'Available now' : 'Currently unavailable'}
              </Text>
            </View>
          </View>
        </View>

        <View style={nearbyDonorDetailStyles.statsCard}>
          <View style={nearbyDonorDetailStyles.statRow}>
            <MapPin color={colors.primary} size={20} strokeWidth={2} />
            <View style={nearbyDonorDetailStyles.statCopy}>
              <Text style={nearbyDonorDetailStyles.statLabel}>Distance</Text>
              <Text style={nearbyDonorDetailStyles.statValue}>
                {formatDistance(donor.distanceMeters)}
              </Text>
            </View>
          </View>

          <View style={nearbyDonorDetailStyles.statRow}>
            <Users color={colors.primary} size={20} strokeWidth={2} />
            <View style={nearbyDonorDetailStyles.statCopy}>
              <Text style={nearbyDonorDetailStyles.statLabel}>Completed donations</Text>
              <Text style={nearbyDonorDetailStyles.statValue}>
                {donor.donationCount} donation{donor.donationCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <Text style={nearbyDonorDetailStyles.lastDonation}>
            {formatLastDonationLabel(donor.lastDonationAt)}
          </Text>
        </View>

        <View style={nearbyDonorDetailStyles.noticeCard}>
          <Text style={nearbyDonorDetailStyles.noticeTitle}>Privacy notice</Text>
          <Text style={nearbyDonorDetailStyles.noticeText}>
            {isRecipient
              ? 'Contact details stay hidden until you accept a donor response on your blood request. Use the button below to open or create a request so donors like this one can respond safely.'
              : 'Exact contact details stay hidden on the map. Coordinate through BloodLink requests and chat after a match is accepted.'}
          </Text>
        </View>

        {isRecipient ? (
          <View style={nearbyDonorDetailStyles.actions}>
            <PrimaryButton
              title="Coordinate through request"
              loading={coordinating}
              onPress={() => void handleRecipientCoordinate()}
            />
            {!donorCompatibleWithRecipient && profile?.blood_type ? (
              <Text style={nearbyDonorDetailStyles.actionHint}>
                This donor is not compatible with your {profile.blood_type} blood type.
              </Text>
            ) : (
              <Text style={nearbyDonorDetailStyles.actionHint}>
                BloodLink notifies compatible donors when you post an open request. You can accept
                their response from your request details.
              </Text>
            )}
          </View>
        ) : null}

        {isDonor ? (
          <View style={nearbyDonorDetailStyles.actions}>
            <PrimaryButton
              title="Browse blood requests"
              variant="secondary"
              onPress={handleDonorBrowseRequests}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
