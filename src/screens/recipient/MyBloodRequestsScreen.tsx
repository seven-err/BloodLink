import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { recipientStyles } from '@/screens/recipient/styles';
import { authStyles } from '@/screens/auth/styles';
import { getMyBloodRequests, type BloodRequest } from '@/services/supabase/bloodRequests';

type Props = NativeStackScreenProps<AppStackParamList, 'MyBloodRequests'>;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

function RequestListItem({
  request,
  onPress,
}: {
  request: BloodRequest;
  onPress: () => void;
}) {
  return (
    <Pressable style={recipientStyles.listCard} onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={recipientStyles.requestTitle}>
          {request.blood_type} · {request.units_needed} unit
          {request.units_needed === 1 ? '' : 's'}
        </Text>
        <View style={recipientStyles.badge}>
          <Text style={recipientStyles.badgeText}>{request.status}</Text>
        </View>
      </View>
      <Text style={recipientStyles.meta}>
        Urgency: {URGENCY_LABELS[request.urgency]}
      </Text>
      <Text style={recipientStyles.meta}>Hospital: {request.hospital_name}</Text>
      <Text style={recipientStyles.meta}>Needed by: {formatDateTime(request.needed_at)}</Text>
    </Pressable>
  );
}

export function MyBloodRequestsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(
    async (isRefresh = false) => {
      if (!session?.user.id) {
        setError('You need to be signed in to view your requests.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const { data, error: fetchError } = await getMyBloodRequests(session.user.id);

      if (fetchError) {
        setError(fetchError.message);
        setRequests([]);
      } else {
        setRequests(data ?? []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [session?.user.id],
  );

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading your blood requests…</Text>
      </View>
    );
  }

  if (error && requests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadRequests()} />
        <PrimaryButton
          title="Create blood request"
          variant="secondary"
          onPress={() => navigation.navigate('CreateBloodRequest')}
        />
      </View>
    );
  }

  return (
    <View style={recipientStyles.screen}>
      <ScrollView
        contentContainerStyle={recipientStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#b91c1c"
            onRefresh={() => void loadRequests(true)}
          />
        }
      >
        <View style={recipientStyles.card}>
          <Text style={recipientStyles.eyebrow}>My requests</Text>
          <Text style={recipientStyles.title}>Blood request history</Text>
          <Text style={recipientStyles.subtitle}>
            Track open requests and review details for each submission.
          </Text>
        </View>

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        {requests.length === 0 ? (
          <View style={recipientStyles.card}>
            <Text style={recipientStyles.emptyText}>
              You have not created any blood requests yet. Start one when you need donor
              support.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              onPress={() =>
                navigation.navigate('BloodRequestDetail', { requestId: request.id })
              }
            />
          ))
        )}

        <PrimaryButton
          title="Create blood request"
          onPress={() => navigation.navigate('CreateBloodRequest')}
        />
      </ScrollView>
    </View>
  );
}
