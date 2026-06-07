import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import { getBloodRequestById, type BloodRequest } from '@/services/supabase/bloodRequests';

type Props = NativeStackScreenProps<AppStackParamList, 'BloodRequestDetail'>;

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

export function BloodRequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      void loadRequest();
    }, [loadRequest]),
  );

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading request details…</Text>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error ?? 'Blood request not found.'}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadRequest()} />
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
          {request.blood_type} · {request.units_needed} unit
          {request.units_needed === 1 ? '' : 's'}
        </Text>
        <View style={recipientStyles.badge}>
          <Text style={recipientStyles.badgeText}>{request.status}</Text>
        </View>
      </View>

      <View style={recipientStyles.card}>
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

      <PrimaryButton
        title="Back to my requests"
        variant="secondary"
        onPress={() => navigation.navigate('MyBloodRequests')}
      />
    </ScrollView>
  );
}
