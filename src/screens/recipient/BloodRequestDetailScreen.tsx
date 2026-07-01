import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { ContentLoadingSkeleton } from '@/components/common/ContentLoadingSkeleton';
import { SafetyReminderCard } from '@/components/bloodRequest/SafetyReminderCard';
import { StatusBadge } from '@/components/bloodRequest/StatusBadge';
import { UrgencyBadge } from '@/components/bloodRequest/UrgencyBadge';
import { RequestLocationMapPreview } from '@/components/map/RequestLocationMapPreview';
import { DonorVerificationBadge } from '@/components/donor/DonorVerificationBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/theme';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import { getBloodRequestById, type BloodRequest } from '@/services/supabase/bloodRequests';
import {
  acceptDonorMatch,
  declineDonorMatch,
  listMatchesForRequest,
  type RecipientDonorMatchResponse,
} from '@/services/supabase/donorMatches';
import { resolveDonorVerificationDisplay } from '@/utils/donorVerificationDisplay';
import { formatDistance, formatTravelTime } from '@/utils/travelMetrics';

type Props = NativeStackScreenProps<AppStackParamList, 'BloodRequestDetail'>;

type MatchActionState = 'idle' | 'accepting' | 'declining' | 'success' | 'error';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={recipientStyles.detailLabel}>{label}</Text>
      <Text style={recipientStyles.detailValue}>{value}</Text>
    </View>
  );
}

function DonorResponseCard({
  bloodRequestId,
  match,
  actionMatchId,
  actionState,
  actionError,
  navigation,
  onAccept,
  onDecline,
}: {
  bloodRequestId: string;
  match: RecipientDonorMatchResponse;
  actionMatchId: string | null;
  actionState: MatchActionState;
  actionError: string | null;
  navigation: NativeStackNavigationProp<AppStackParamList, 'BloodRequestDetail'>;
  onAccept: (match: RecipientDonorMatchResponse) => void;
  onDecline: (match: RecipientDonorMatchResponse) => void;
}) {
  const isPending = match.status === 'pending';
  const isBusy = actionMatchId === match.id && actionState !== 'idle' && actionState !== 'error';
  const travelTime = formatTravelTime(match.travel_time_seconds);
  const donorLabel = match.donor_name?.trim() || 'BloodLink donor';
  const verificationStatus = resolveDonorVerificationDisplay({
    latestStatus: match.donor_verification_status,
    verificationActive: match.donor_verification_active,
  });

  return (
    <View style={recipientStyles.listCard}>
      <View style={recipientStyles.cardHeaderRow}>
        <View style={recipientStyles.donorTitleRow}>
          <Text numberOfLines={1} style={recipientStyles.donorName}>
            {donorLabel}
          </Text>
          <DonorVerificationBadge status={verificationStatus} />
        </View>
        <StatusBadge status={match.status} />
      </View>
      <Text style={recipientStyles.meta}>Blood type: {match.donor_blood_type}</Text>
      <Text style={recipientStyles.meta}>{formatDistance(match.distance_meters)}</Text>
      {travelTime ? <Text style={recipientStyles.meta}>{travelTime}</Text> : null}
      <Text style={recipientStyles.meta}>
        Responded: {formatDateTime(match.responded_at ?? match.created_at)}
      </Text>

      {isPending ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Accept"
              loading={isBusy && actionState === 'accepting'}
              disabled={isBusy}
              onPress={() => onAccept(match)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Decline"
              variant="secondary"
              loading={isBusy && actionState === 'declining'}
              disabled={isBusy}
              onPress={() => onDecline(match)}
            />
          </View>
        </View>
      ) : null}

      {match.status === 'accepted' || match.status === 'completed' ? (
        <PrimaryButton
          title="Message donor"
          onPress={() =>
            navigation.navigate('ChatThread', {
              bloodRequestId,
              donorMatchId: match.id,
              recipientDisplayName: donorLabel,
              recipientId: match.donor_id,
            })
          }
        />
      ) : null}

      {actionMatchId === match.id && actionState === 'error' && actionError ? (
        <Text style={authStyles.error}>{actionError}</Text>
      ) : null}
    </View>
  );
}

function DonorResponsesSection({
  bloodRequestId,
  matches,
  matchesLoading,
  matchesError,
  actionMatchId,
  actionState,
  actionError,
  actionSuccessMessage,
  navigation,
  onAccept,
  onDecline,
  onRetry,
}: {
  bloodRequestId: string;
  matches: RecipientDonorMatchResponse[];
  matchesLoading: boolean;
  matchesError: string | null;
  actionMatchId: string | null;
  actionState: MatchActionState;
  actionError: string | null;
  actionSuccessMessage: string | null;
  navigation: NativeStackNavigationProp<AppStackParamList, 'BloodRequestDetail'>;
  onAccept: (match: RecipientDonorMatchResponse) => void;
  onDecline: (match: RecipientDonorMatchResponse) => void;
  onRetry: () => void;
}) {
  if (matchesLoading) {
    return (
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Donor responses</Text>
        <ActivityIndicator color={colors.primaryDark} />
        <Text style={recipientStyles.subtitle}>Loading donor responses…</Text>
      </View>
    );
  }

  if (matchesError) {
    return (
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Donor responses</Text>
        <Text style={authStyles.error}>{matchesError}</Text>
        <PrimaryButton title="Retry loading responses" variant="secondary" onPress={onRetry} />
      </View>
    );
  }

  return (
    <View style={recipientStyles.card}>
      <Text style={recipientStyles.eyebrow}>Donor responses</Text>
      <Text style={recipientStyles.title}>
        {matches.length === 0 ? 'No responses yet' : `${matches.length} response${matches.length === 1 ? '' : 's'}`}
      </Text>
      <Text style={recipientStyles.subtitle}>
        Review donors who responded to this request. Only name and blood type are shown until you
        accept a match.
      </Text>

      {actionSuccessMessage ? (
        <Text style={recipientStyles.successText}>{actionSuccessMessage}</Text>
      ) : null}

      {matches.length === 0 ? (
        <Text style={recipientStyles.emptyText}>
          When verified donors respond, their interest will appear here for you to accept or
          decline.
        </Text>
      ) : (
        matches.map((match) => (
          <DonorResponseCard
            key={match.id}
            actionError={actionError}
            actionMatchId={actionMatchId}
            actionState={actionState}
            bloodRequestId={bloodRequestId}
            match={match}
            navigation={navigation}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))
      )}
    </View>
  );
}

export function BloodRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<RecipientDonorMatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [actionMatchId, setActionMatchId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<MatchActionState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true);
    setMatchesError(null);

    const { data, error: fetchError } = await listMatchesForRequest(requestId);

    if (fetchError) {
      setMatchesError(fetchError.message);
      setMatches([]);
    } else {
      setMatches(data ?? []);
    }

    setMatchesLoading(false);
  }, [requestId]);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getBloodRequestById(requestId);

    if (fetchError) {
      setError(fetchError.message);
      setRequest(null);
    } else if (!data) {
      setError('Blood request not found or you do not have access.');
      setRequest(null);
    } else {
      setRequest(data);
    }

    setLoading(false);
  }, [requestId]);

  const loadScreenData = useCallback(async () => {
    setActionSuccessMessage(null);
    setActionError(null);
    setActionState('idle');
    setActionMatchId(null);
    await Promise.all([loadRequest(), loadMatches()]);
  }, [loadMatches, loadRequest]);

  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData]),
  );

  const handleMatchAction = useCallback(
    async (
      match: RecipientDonorMatchResponse,
      action: 'accept' | 'decline',
    ) => {
      const actionLabel = action === 'accept' ? 'Accept' : 'Decline';
      const donorLabel = match.donor_name?.trim() || 'this donor';

      return new Promise<void>((resolve) => {
        Alert.alert(
          `${actionLabel} donor response?`,
          action === 'accept'
            ? `Accept ${donorLabel} (${match.donor_blood_type})? They will be able to view full request details to coordinate donation.`
            : `Decline ${donorLabel}'s response? They will not receive your contact details.`,
          [
            { style: 'cancel', text: 'Cancel', onPress: () => resolve() },
            {
              style: action === 'accept' ? 'default' : 'destructive',
              text: actionLabel,
              onPress: () => {
                void (async () => {
                  setActionMatchId(match.id);
                  setActionState(action === 'accept' ? 'accepting' : 'declining');
                  setActionError(null);
                  setActionSuccessMessage(null);

                  const result =
                    action === 'accept'
                      ? await acceptDonorMatch(match.id)
                      : await declineDonorMatch(match.id);

                  if (result.kind === 'success') {
                    setActionState('success');
                    setActionSuccessMessage(
                      action === 'accept'
                        ? `Accepted ${donorLabel}. They can now view full request details.`
                        : `Declined ${donorLabel}'s response.`,
                    );
                    await loadMatches();
                    resolve();
                    return;
                  }

                  setActionState('error');

                  if (result.kind === 'not_found') {
                    setActionError('This donor response is no longer available.');
                  } else if (result.kind === 'invalid_transition') {
                    setActionError(result.message);
                    await loadMatches();
                  } else {
                    setActionError(result.message);
                  }

                  resolve();
                })();
              },
            },
          ],
        );
      });
    },
    [loadMatches],
  );

  if (loading) {
    return <ContentLoadingSkeleton rows={2} />;
  }

  if (error || !request) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error ?? 'Blood request not found.'}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadScreenData()} />
        <PrimaryButton
          title="Back to my requests"
          variant="secondary"
          onPress={() => navigation.navigate('MyBloodRequests')}
        />
      </View>
    );
  }

  const coordinates =
    request.latitude !== null && request.longitude !== null
      ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`
      : 'Not captured';

  return (
    <ScrollView
      contentContainerStyle={recipientStyles.scrollContent}
      style={recipientStyles.screen}
    >
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Request details</Text>
        <Text style={recipientStyles.title}>
          {request.patient_name?.trim() || `${request.blood_type} request`}
        </Text>
        <Text style={recipientStyles.subtitle}>{request.hospital_name}</Text>
        <View style={recipientStyles.heroBadgeRow}>
          <BloodTypeBadge bloodType={request.blood_type} size="lg" />
          <UrgencyBadge urgency={request.urgency} />
          <StatusBadge status={request.status} />
        </View>
      </View>

      <DonorResponsesSection
        actionError={actionError}
        actionMatchId={actionMatchId}
        actionState={actionState}
        actionSuccessMessage={actionSuccessMessage}
        bloodRequestId={requestId}
        matches={matches}
        matchesError={matchesError}
        matchesLoading={matchesLoading}
        navigation={navigation}
        onAccept={(match) => void handleMatchAction(match, 'accept')}
        onDecline={(match) => void handleMatchAction(match, 'decline')}
        onRetry={() => void loadMatches()}
      />

      <RequestLocationMapPreview
        latitude={request.latitude}
        longitude={request.longitude}
        subtitle="This preview uses the coordinates saved with your request."
        title="Request location preview"
      />

      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Full details</Text>
        <View style={recipientStyles.detailGrid}>
          <DetailRow label="Units needed" value={String(request.units_needed)} />
          <DetailRow label="Urgency" value={URGENCY_LABELS[request.urgency]} />
          <DetailRow label="Needed by" value={formatDateTime(request.needed_at)} />
          <DetailRow label="Patient" value={request.patient_name ?? 'Not set'} />
          <DetailRow label="Hospital" value={request.hospital_name} />
          <DetailRow label="Contact phone" value={request.contact_phone ?? 'Not set'} />
          <DetailRow label="Address" value={request.address ?? 'Not set'} />
          <DetailRow label="Coordinates" value={coordinates} />
          <DetailRow label="Notes" value={request.notes?.trim() || 'None'} />
          <DetailRow label="Created" value={formatDateTime(request.created_at)} />
          <DetailRow label="Last updated" value={formatDateTime(request.updated_at)} />
        </View>
      </View>

      <SafetyReminderCard />

      <PrimaryButton
        title="Back to my requests"
        variant="secondary"
        onPress={() => navigation.navigate('MyBloodRequests')}
      />
    </ScrollView>
  );
}
