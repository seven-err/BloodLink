import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ContentLoadingSkeleton } from '@/components/common/ContentLoadingSkeleton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  listDonorVerifiableItems,
  type DonorDonationListItem,
} from '@/services/supabase/donations';

type Props = NativeStackScreenProps<AppStackParamList, 'MyDonations'>;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

const formatStatusLabel = (item: DonorDonationListItem) => {
  if (item.donationStatus) {
    return item.donationStatus.replace('_', ' ');
  }

  return item.matchStatus;
};

function DonationListItem({
  item,
  onPress,
}: {
  item: DonorDonationListItem;
  onPress: () => void;
}) {
  return (
    <Pressable style={recipientStyles.listCard} onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={recipientStyles.requestTitle}>
          {item.bloodType} · {item.unitsNeeded} unit
          {item.unitsNeeded === 1 ? '' : 's'}
        </Text>
        <View style={recipientStyles.badge}>
          <Text style={recipientStyles.badgeText}>{formatStatusLabel(item)}</Text>
        </View>
      </View>
      <Text style={recipientStyles.meta}>Hospital: {item.hospitalName}</Text>
      <Text style={recipientStyles.meta}>Urgency: {URGENCY_LABELS[item.urgency]}</Text>
      <Text style={recipientStyles.meta}>Needed by: {formatDateTime(item.neededAt)}</Text>
      <Text style={recipientStyles.meta}>Updated: {formatDateTime(item.createdAt)}</Text>
    </Pressable>
  );
}

export function MyDonationsScreen({ navigation }: Props) {
  const { session } = useAuth();
  const donorId = session?.user.id;

  const [items, setItems] = useState<DonorDonationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(
    async (isRefresh = false) => {
      if (!donorId) {
        setError('You need to be signed in as a donor to view donations.');
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

      const { data, error: loadError } = await listDonorVerifiableItems(donorId);

      if (loadError) {
        setError(loadError.message);
        setItems([]);
      } else {
        setItems(data ?? []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [donorId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  const handleOpenQr = (item: DonorDonationListItem) => {
    navigation.navigate('DonationQr', {
      donationId: item.donationId ?? undefined,
      matchId: item.matchId,
    });
  };

  if (loading) {
    return <ContentLoadingSkeleton />;
  }

  if (error) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadItems()} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={recipientStyles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadItems(true)} />
      }
      style={recipientStyles.screen}
    >
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Donation history</Text>
        <Text style={recipientStyles.title}>My donations</Text>
        <Text style={recipientStyles.subtitle}>
          Accepted matches appear here. Show your QR code at the blood bank or PRC collection
          point for verification.
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={recipientStyles.card}>
          <Text style={recipientStyles.emptyText}>
            No accepted donation matches yet. Respond to open requests and wait for a recipient
            to accept your match.
          </Text>
          <PrimaryButton
            title="Browse open requests"
            onPress={() => navigation.navigate('AppTabs', { screen: 'Requests' })}
          />
        </View>
      ) : (
        items.map((item) => (
          <DonationListItem key={item.matchId} item={item} onPress={() => handleOpenQr(item)} />
        ))
      )}
    </ScrollView>
  );
}
