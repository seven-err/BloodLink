import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/services/supabase/notifications';
import { subscribeToUserNotifications, unsubscribe } from '@/services/supabase/realtime';
import { parseNotificationData } from '@/utils/notificationData';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

const formatTimestamp = (value: string) => new Date(value).toLocaleString();

const formatTypeLabel = (type: AppNotification['type']) => {
  switch (type) {
    case 'blood_request':
      return 'Blood request';
    case 'donor_match':
      return 'Donor match';
    case 'donation':
      return 'Donation';
    case 'verification':
      return 'Verification';
    case 'system':
      return 'System';
    default:
      return 'Update';
  }
};

function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const isUnread = notification.read_at === null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.notificationCard, isUnread ? styles.notificationCardUnread : null]}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationType}>{formatTypeLabel(notification.type)}</Text>
        {isUnread ? <View style={styles.unreadDot} /> : null}
      </View>
      <Text style={styles.notificationTitle}>{notification.title}</Text>
      <Text style={styles.notificationBody}>{notification.body}</Text>
      <Text style={styles.notificationTime}>{formatTimestamp(notification.created_at)}</Text>
    </Pressable>
  );
}

export function NotificationsScreen({ navigation }: Props) {
  const { profile, session } = useAuth();
  const userId = session?.user.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError('You must be signed in to view notifications.');
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

      const { data, error: loadError } = await listNotifications();

      if (loadError) {
        setError(loadError.message);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();

      if (!userId) {
        return undefined;
      }

      const channel = subscribeToUserNotifications(userId, () => {
        void loadNotifications(true);
      });

      return () => {
        unsubscribe(channel);
      };
    }, [loadNotifications, userId]),
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAllRead(true);

    const { error: markError } = await markAllNotificationsRead();

    if (markError) {
      setError(markError.message);
      setMarkingAllRead(false);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.read_at
          ? notification
          : { ...notification, read_at: new Date().toISOString() },
      ),
    );
    setMarkingAllRead(false);
  }, []);

  const handleOpenNotification = useCallback(
    async (notification: AppNotification) => {
      if (!notification.read_at) {
        const { error: markError } = await markNotificationRead(notification.id);

        if (!markError) {
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? { ...item, read_at: new Date().toISOString() }
                : item,
            ),
          );
        }
      }

      const related = parseNotificationData(notification.data);
      const isDonor = profile?.role === 'donor';

      if (notification.type === 'donation' && isDonor && related.relatedMatchId) {
        navigation.navigate('DonationQr', {
          donationId: related.relatedDonationId,
          matchId: related.relatedMatchId,
        });
        return;
      }

      if (related.relatedRequestId) {
        if (isDonor) {
          navigation.navigate('DonorRequestDetail', { requestId: related.relatedRequestId });
        } else {
          navigation.navigate('BloodRequestDetail', { requestId: related.relatedRequestId });
        }
      }
    },
    [navigation, profile?.role],
  );

  const unreadCount = notifications.filter((notification) => notification.read_at === null).length;

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading notifications…</Text>
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadNotifications()} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={recipientStyles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadNotifications(true)} />
      }
      style={recipientStyles.screen}
    >
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>In-app updates</Text>
        <Text style={recipientStyles.title}>Notifications</Text>
        <Text style={recipientStyles.subtitle}>
          Stay updated on donor responses, match decisions, and donation records. Messages never
          include patient names, phone numbers, or other sensitive contact details.
        </Text>
        {unreadCount > 0 ? (
          <PrimaryButton
            title={markingAllRead ? 'Marking all as read…' : `Mark all as read (${unreadCount})`}
            variant="secondary"
            loading={markingAllRead}
            onPress={() => void handleMarkAllRead()}
          />
        ) : null}
      </View>

      {error ? (
        <View style={recipientStyles.card}>
          <Text style={authStyles.error}>{error}</Text>
          <PrimaryButton title="Retry" variant="secondary" onPress={() => void loadNotifications()} />
        </View>
      ) : null}

      {notifications.length === 0 ? (
        <View style={recipientStyles.card}>
          <Text style={recipientStyles.emptyText}>
            No notifications yet. You will see updates here when donors respond, matches change, or
            donation records are created.
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onPress={() => void handleOpenNotification(notification)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notificationBody: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderColor: '#fecaca',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  notificationCardUnread: {
    backgroundColor: '#fff7f7',
    borderColor: '#f87171',
  },
  notificationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationTime: {
    color: '#9ca3af',
    fontSize: 13,
  },
  notificationTitle: {
    color: '#991b1b',
    fontSize: 17,
    fontWeight: '800',
  },
  notificationType: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  unreadDot: {
    backgroundColor: '#dc2626',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});
