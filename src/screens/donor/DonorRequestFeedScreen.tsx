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
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  getOpenBloodRequestsFeed,
  type OpenBloodRequestFeedItem,
} from '@/services/supabase/openBloodRequestsFeed';

type Props = NativeStackScreenProps<AppStackParamList, 'DonorRequestFeed'>;

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

  return `Approx. ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
};

function FeedListItem({
  request,
  onPress,
}: {
  request: OpenBloodRequestFeedItem;
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
          <Text style={recipientStyles.badgeText}>{URGENCY_LABELS[request.urgency]}</Text>
        </View>
      </View>
      <Text style={recipientStyles.meta}>
        Needed by: {formatDateTime(request.needed_at)}
      </Text>
      <Text style={recipientStyles.meta}>
        {formatApproximateLocation(request.latitude, request.longitude)}
      </Text>
    </Pressable>
  );
}

export function DonorRequestFeedScreen({ navigation }: Props) {
  const [requests, setRequests] = useState<OpenBloodRequestFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    const { data, error: fetchError } = await getOpenBloodRequestsFeed();

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      setRequests(data ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading open blood requests…</Text>
      </View>
    );
  }

  if (error && requests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadRequests()} />
        <PrimaryButton
          title="Back to donor home"
          variant="secondary"
          onPress={() => navigation.navigate('DonorHome')}
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
          <Text style={recipientStyles.eyebrow}>Open requests</Text>
          <Text style={recipientStyles.title}>Nearby blood needs</Text>
          <Text style={recipientStyles.subtitle}>
            Browse open requests you may be able to help with. Contact details are shared
            only after you are matched.
          </Text>
        </View>

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        {requests.length === 0 ? (
          <View style={recipientStyles.card}>
            <Text style={recipientStyles.emptyText}>
              There are no open blood requests right now. Pull down to refresh or check
              back later.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <FeedListItem
              key={request.id}
              request={request}
              onPress={() =>
                navigation.navigate('DonorRequestDetail', { requestId: request.id })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
