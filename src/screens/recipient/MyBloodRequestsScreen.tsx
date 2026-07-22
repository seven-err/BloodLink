import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RequestListCard } from '@/components/bloodRequest/RequestListCard';
import { ContentLoadingSkeleton } from '@/components/common/ContentLoadingSkeleton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/theme';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import { useAuth } from '@/context/AuthContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { recipientStyles } from '@/screens/recipient/styles';
import { authStyles } from '@/screens/auth/styles';
import { getMyBloodRequests, type BloodRequest } from '@/services/supabase/bloodRequests';

type Props =
  | CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList, 'Requests'>,
      NativeStackScreenProps<AppStackParamList>
    >
  | NativeStackScreenProps<AppStackParamList, 'MyBloodRequests'>;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

export function MyBloodRequestsScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const isTabScreen = 'jumpTo' in navigation;
  const stackNavigation = 'getParent' in navigation ? navigation.getParent() : navigation;
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

  const openCreateRequest = () => {
    stackNavigation?.navigate('CreateBloodRequest');
  };

  if (loading) {
    return <ContentLoadingSkeleton />;
  }

  if (error && requests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadRequests()} />
        <PrimaryButton
          title="Create blood request"
          variant="secondary"
          onPress={openCreateRequest}
        />
      </View>
    );
  }

  return (
    <View style={recipientStyles.screen}>
      {isTabScreen ? (
        <View style={[recipientStyles.tabHeader, { paddingTop: topInset + 8 }]}>
          <Text style={recipientStyles.tabHeaderTitle}>My Requests</Text>
          <Pressable
            accessibilityLabel="Create blood request"
            accessibilityRole="button"
            style={({ pressed }) => [
              recipientStyles.createHeaderButton,
              pressed ? recipientStyles.createHeaderButtonPressed : null,
            ]}
            onPress={openCreateRequest}
          >
            <Plus color={colors.primaryForeground} size={18} strokeWidth={2.5} />
            <Text style={recipientStyles.createHeaderButtonText}>Create</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={recipientStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void loadRequests(true)}
          />
        }
      >
        {!isTabScreen ? (
          <View style={recipientStyles.card}>
            <View style={recipientStyles.sectionIntro}>
              <Text style={recipientStyles.eyebrow}>My requests</Text>
              <Text style={recipientStyles.title}>Blood request history</Text>
              <Text style={recipientStyles.subtitle}>
                Track open requests and review details for each submission.
              </Text>
            </View>
          </View>
        ) : null}

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        {requests.length === 0 ? (
          <View style={recipientStyles.emptyCard}>
            <Text style={recipientStyles.emptyText}>
              You have not created any blood requests yet. Start one when you need donor
              support.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestListCard
              key={request.id}
              bloodType={request.blood_type}
              metaLines={[
                `Urgency: ${URGENCY_LABELS[request.urgency]}`,
                `Hospital: ${request.hospital_name}`,
                `Needed by: ${formatDateTime(request.needed_at)}`,
              ]}
              status={request.status}
              title={request.patient_name?.trim() || undefined}
              unitsNeeded={request.units_needed}
              urgency={request.urgency}
              onPress={() =>
                stackNavigation?.navigate('BloodRequestDetail', { requestId: request.id })
              }
            />
          ))
        )}

        {!isTabScreen ? (
          <PrimaryButton title="Create blood request" onPress={openCreateRequest} />
        ) : null}
      </ScrollView>
    </View>
  );
}
