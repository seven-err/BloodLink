import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationFilterTabs } from '@/components/notifications/NotificationFilterTabs';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Skeleton } from '@/components/common/Skeleton';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { notificationStyles } from '@/screens/notifications/styles';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/services/supabase/notifications';
import { subscribeToUserNotifications, unsubscribe } from '@/services/supabase/realtime';
import {
  filterNotifications,
  isImportantNotification,
  type NotificationFilter,
} from '@/utils/notificationDisplay';
import { parseNotificationData } from '@/utils/notificationData';

import { appCache } from '@/utils/appCache';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

function NotificationsSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={notificationStyles.screen}>
      <View style={[notificationStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton borderRadius={8} height={22} width={22} />
        <Skeleton borderRadius={8} height={20} width={120} />
        <Skeleton borderRadius={8} height={16} width={72} />
      </View>
      <View style={notificationStyles.listContent}>
        <Skeleton borderRadius={999} height={46} width="100%" />
        <Skeleton borderRadius={16} height={130} width="100%" />
        <Skeleton borderRadius={16} height={130} width="100%" />
        <Skeleton borderRadius={16} height={110} width="100%" />
        <Skeleton borderRadius={16} height={110} width="100%" />
      </View>
    </View>
  );
}

export function NotificationsScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const userId = session?.user.id;
  const cachedNotifications = userId
    ? appCache.getSync<AppNotification[]>(`notifications:${userId}`)
    : undefined;

  const [notifications, setNotifications] = useState<AppNotification[]>(
    () => cachedNotifications ?? [],
  );
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [loading, setLoading] = useState(() => cachedNotifications === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (!userId) {
        setError('You must be signed in to view notifications.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else if (!isSilent && !appCache.getSync(`notifications:${userId}`)) {
        setLoading(true);
      }

      setError(null);

      const { data, error: loadError } = await listNotifications();

      if (loadError) {
        setError(loadError.message);
        if (!isSilent && !appCache.getSync(`notifications:${userId}`)) {
          setNotifications([]);
        }
      } else {
        const fresh = data ?? [];
        setNotifications(fresh);
        appCache.setSync(`notifications:${userId}`, fresh);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(false, true);

      if (!userId) {
        return undefined;
      }

      const channel = subscribeToUserNotifications(userId, () => {
        void loadNotifications(true, true);
      });

      return () => {
        unsubscribe(channel);
      };
    }, [loadNotifications, userId]),
  );

  const filterCounts = useMemo(
    () => ({
      all: notifications.length,
      important: notifications.filter((notification) => isImportantNotification(notification))
        .length,
      unread: notifications.filter((notification) => notification.read_at === null).length,
    }),
    [notifications],
  );

  const visibleNotifications = useMemo(
    () => filterNotifications(notifications, activeFilter),
    [activeFilter, notifications],
  );

  const unreadCount = filterCounts.unread;

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0 || markingAllRead) {
      return;
    }

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
  }, [markingAllRead, unreadCount]);

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

  if (loading) {
    return <NotificationsSkeleton topInset={topInset} />;
  }

  if (error && notifications.length === 0) {
    return (
      <View style={[notificationStyles.screen, { justifyContent: 'center', padding: 24 }]}>
        <Text style={authStyles.error}>{error}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadNotifications()} />
      </View>
    );
  }

  return (
    <View style={notificationStyles.screen}>
      <View style={[notificationStyles.header, { paddingTop: topInset + 8 }]}>
        <View style={notificationStyles.headerSide}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={colors.foreground} size={22} />
          </Pressable>
        </View>
        <Text style={notificationStyles.headerTitle}>Notifications</Text>
        <View style={[notificationStyles.headerSide, { alignItems: 'flex-end' }]}>
          <Pressable
            accessibilityLabel="Mark all notifications as read"
            accessibilityRole="button"
            disabled={unreadCount === 0 || markingAllRead}
            onPress={() => void handleMarkAllRead()}
          >
            <Text
              style={[
                notificationStyles.headerAction,
                unreadCount === 0 || markingAllRead
                  ? notificationStyles.headerActionDisabled
                  : null,
              ]}
            >
              {markingAllRead ? 'Marking…' : 'Mark all read'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={notificationStyles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primaryDark}
            onRefresh={() => void loadNotifications(true)}
          />
        }
      >
        <NotificationFilterTabs
          activeFilter={activeFilter}
          counts={filterCounts}
          onChange={setActiveFilter}
        />

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        {visibleNotifications.length === 0 ? (
          <View style={notificationStyles.emptyCard}>
            <Text style={notificationStyles.emptyText}>
              {activeFilter === 'unread'
                ? 'You are all caught up. No unread notifications right now.'
                : activeFilter === 'important'
                  ? 'No important notifications yet. High-priority alerts will appear here.'
                  : 'No notifications yet. You will see updates here when donors respond, matches change, or donation records are created.'}
            </Text>
          </View>
        ) : (
          visibleNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => void handleOpenNotification(notification)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
