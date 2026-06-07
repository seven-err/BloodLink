import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  getOpenBloodRequestById,
  type OpenBloodRequestFeedItem,
} from '@/services/supabase/openBloodRequestsFeed';

type Props = NativeStackScreenProps<AppStackParamList, 'DonorRequestDetail'>;

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

export function DonorRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<OpenBloodRequestFeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getOpenBloodRequestById(requestId);

    if (fetchError) {
      setError(fetchError.message);
      setRequest(null);
    } else if (!data) {
      setError('This request is no longer open or you do not have access.');
      setRequest(null);
    } else {
      setRequest(data);
    }

    setLoading(false);
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      void loadRequest();
    }, [loadRequest]),
  );

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
          Patient and hospital details are hidden until you are matched with this request.
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

      <PrimaryButton
        title="Back to open requests"
        variant="secondary"
        onPress={() => navigation.navigate('DonorRequestFeed')}
      />
    </ScrollView>
  );
}
