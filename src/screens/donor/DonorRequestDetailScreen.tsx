import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  canShowSensitiveRequestDetails,
  getAuthorizedBloodRequestById,
  getDonorMatchForRequest,
  respondToBloodRequest,
  type DonorMatch,
  type MatchedBloodRequestDetails,
} from '@/services/supabase/donorMatches';
import { isQrEligibleMatchStatus } from '@/services/supabase/donations';
import {
  getOpenBloodRequestById,
  type OpenBloodRequestFeedItem,
} from '@/services/supabase/openBloodRequestsFeed';

type Props = NativeStackScreenProps<AppStackParamList, 'DonorRequestDetail'>;

type ResponseUiState = 'idle' | 'responding' | 'success' | 'error';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

const formatApproximateLocation = (
  latitude: number | null,
  longitude: number | null,
) => {
  if (latitude === null || longitude === null) {
    return 'Location not shared';
  }

  return `Approx. ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={recipientStyles.detailLabel}>{label}</Text>
      <Text style={recipientStyles.detailValue}>{value}</Text>
    </View>
  );
}

function ResponseStatusCard({
  hasExistingMatch,
  match,
  responseState,
  responseError,
}: {
  hasExistingMatch: boolean;
  match: DonorMatch | null;
  responseState: ResponseUiState;
  responseError: string | null;
}) {
  if (responseState === 'responding') {
    return (
      <View style={recipientStyles.card}>
        <ActivityIndicator color="#b91c1c" />
        <Text style={recipientStyles.subtitle}>Submitting your response…</Text>
      </View>
    );
  }

  if (responseState === 'error' && responseError) {
    return (
      <View style={recipientStyles.card}>
        <Text style={authStyles.error}>{responseError}</Text>
      </View>
    );
  }

  if (hasExistingMatch && responseState !== 'success') {
    return (
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Response recorded</Text>
        <Text style={recipientStyles.title}>You already responded</Text>
        <Text style={recipientStyles.subtitle}>
          Your interest in this request is on file with status &quot;{match?.status ?? 'pending'}
          &quot;. Healthcare or blood bank personnel will verify eligibility and contact you if
          needed.
        </Text>
      </View>
    );
  }

  if (responseState === 'success') {
    return (
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Response sent</Text>
        <Text style={recipientStyles.title}>Thank you for responding</Text>
        <Text style={recipientStyles.subtitle}>
          Your interest has been recorded. Healthcare or blood bank personnel will verify your
          eligibility and contact you with next steps. Patient and hospital contact details stay
          hidden until your match is accepted.
        </Text>
      </View>
    );
  }

  return null;
}

function SensitiveDetailsCard({ details }: { details: MatchedBloodRequestDetails }) {
  return (
    <View style={recipientStyles.card}>
      <Text style={recipientStyles.eyebrow}>Matched request details</Text>
      <Text style={recipientStyles.subtitle}>
        Your match was accepted. Use these details to coordinate donation.
      </Text>
      <DetailRow label="Patient" value={details.patient_name?.trim() || 'Not provided'} />
      <DetailRow label="Hospital" value={details.hospital_name} />
      <DetailRow label="Contact phone" value={details.contact_phone?.trim() || 'Not provided'} />
      <DetailRow label="Address" value={details.address?.trim() || 'Not provided'} />
      {details.notes?.trim() ? <DetailRow label="Notes" value={details.notes.trim()} /> : null}
    </View>
  );
}

export function DonorRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const { session, profile } = useAuth();
  const donorId = session?.user.id;

  const [request, setRequest] = useState<OpenBloodRequestFeedItem | null>(null);
  const [existingMatch, setExistingMatch] = useState<DonorMatch | null>(null);
  const [matchedDetails, setMatchedDetails] = useState<MatchedBloodRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<ResponseUiState>('idle');
  const [responseError, setResponseError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!donorId) {
      setError('You must be signed in as a donor to view this request.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [
      { data: feedItem, error: feedError },
      { data: donorMatch, error: matchError },
    ] = await Promise.all([
      getOpenBloodRequestById(requestId),
      getDonorMatchForRequest(requestId, donorId),
    ]);

    if (feedError) {
      setError(feedError.message);
      setRequest(null);
      setExistingMatch(null);
      setMatchedDetails(null);
      setLoading(false);
      return;
    }

    if (matchError) {
      setError(matchError.message);
      setRequest(null);
      setExistingMatch(null);
      setMatchedDetails(null);
      setLoading(false);
      return;
    }

    setExistingMatch(donorMatch);

    if (!feedItem && !donorMatch) {
      setError('This request is no longer open or you do not have access.');
      setRequest(null);
      setMatchedDetails(null);
      setLoading(false);
      return;
    }

    setRequest(feedItem);

    if (donorMatch && canShowSensitiveRequestDetails(donorMatch)) {
      const { data: authorizedDetails, error: detailsError } =
        await getAuthorizedBloodRequestById(requestId);

      if (detailsError) {
        setMatchedDetails(null);
      } else {
        setMatchedDetails(authorizedDetails);
      }
    } else {
      setMatchedDetails(null);
    }

    setLoading(false);
  }, [donorId, requestId]);

  useFocusEffect(
    useCallback(() => {
      void loadRequest();
    }, [loadRequest]),
  );

  const handleRespond = useCallback(async () => {
    if (!donorId || !request) {
      setResponseError('You must be signed in to respond to this request.');
      setResponseState('error');
      return;
    }

    setResponseState('responding');
    setResponseError(null);

    const result = await respondToBloodRequest(requestId, donorId, {
      donorLatitude: profile?.latitude ?? null,
      donorLongitude: profile?.longitude ?? null,
      requestLatitude: request.latitude,
      requestLongitude: request.longitude,
    });

    if (result.kind === 'error') {
      setResponseError(result.message);
      setResponseState('error');
      return;
    }

    setExistingMatch(result.match);

    if (result.kind === 'duplicate') {
      setResponseState('idle');
      return;
    }

    setResponseState('success');
  }, [donorId, profile?.latitude, profile?.longitude, request, requestId]);

  const hasResponded = Boolean(existingMatch);
  const showRespondButton = !hasResponded && responseState !== 'success';
  const showStatusCard =
    responseState === 'responding' ||
    responseState === 'success' ||
    responseState === 'error' ||
    hasResponded;

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading request preview…</Text>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error ?? 'Blood request not found.'}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadRequest()} />
        <PrimaryButton
          title="Back to open requests"
          variant="secondary"
          onPress={() => navigation.navigate('DonorRequestFeed')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={recipientStyles.scrollContent}
      style={recipientStyles.screen}
    >
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Request preview</Text>
        <Text style={recipientStyles.title}>
          {request.blood_type} · {request.units_needed} unit
          {request.units_needed === 1 ? '' : 's'}
        </Text>
        <View style={recipientStyles.badge}>
          <Text style={recipientStyles.badgeText}>{URGENCY_LABELS[request.urgency]}</Text>
        </View>
        <Text style={recipientStyles.subtitle}>
          Patient and hospital details are hidden until your match is accepted.
        </Text>
      </View>

      <View style={recipientStyles.card}>
        <DetailRow label="Urgency" value={URGENCY_LABELS[request.urgency]} />
        <DetailRow label="Units needed" value={String(request.units_needed)} />
        <DetailRow label="Blood type" value={request.blood_type} />
        <DetailRow label="Needed by" value={formatDateTime(request.needed_at)} />
        <DetailRow
          label="Approximate location"
          value={formatApproximateLocation(request.latitude, request.longitude)}
        />
        <DetailRow label="Posted" value={formatDateTime(request.created_at)} />
        <DetailRow label="Last updated" value={formatDateTime(request.updated_at)} />
      </View>

      {showStatusCard ? (
        <ResponseStatusCard
          hasExistingMatch={hasResponded}
          match={existingMatch}
          responseError={responseError}
          responseState={responseState}
        />
      ) : null}

      {matchedDetails ? <SensitiveDetailsCard details={matchedDetails} /> : null}

      {existingMatch && isQrEligibleMatchStatus(existingMatch.status) ? (
        <PrimaryButton
          title="View donation QR"
          onPress={() =>
            navigation.navigate('DonationQr', {
              matchId: existingMatch.id,
            })
          }
        />
      ) : null}

      {showRespondButton ? (
        <PrimaryButton
          title={responseState === 'error' ? 'Try again' : 'Respond to request'}
          loading={responseState === 'responding'}
          onPress={() => void handleRespond()}
        />
      ) : null}

      <PrimaryButton
        title="Back to open requests"
        variant="secondary"
        onPress={() => navigation.navigate('DonorRequestFeed')}
      />
    </ScrollView>
  );
}
