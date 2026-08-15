import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { navigate } from '@/navigation/navigationRef';
import { isRemotePushSupported } from '@/services/notifications/pushRegistration';
import { parseNotificationData } from '@/utils/notificationData';

export const NOTIFICATION_CHANNEL_ID = 'bloodlink-default';

export function useNotificationHandler() {
  const isSetupRef = useRef(false);

  useEffect(() => {
    if (!isRemotePushSupported() || isSetupRef.current) {
      return;
    }

    isSetupRef.current = true;
    let isMounted = true;
    let removeReceivedListener: (() => void) | null = null;
    let removeResponseListener: (() => void) | null = null;

    const setupNotifications = async () => {
      try {
        const Notifications = await import('expo-notifications');

        if (!isMounted) {
          return;
        }

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
            importance: Notifications.AndroidImportance.MAX,
            lightColor: '#b91c1c',
            name: 'BloodLink Notifications',
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
          if (__DEV__) {
            console.info('[push] notification received foreground:', notification);
          }
        });

        const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const rawData = response.notification.request.content.data;
          if (__DEV__) {
            console.info('[push] notification response tapped:', rawData);
          }

          if (!rawData || typeof rawData !== 'object') {
            navigate('Notifications');
            return;
          }

          const parsed = parseNotificationData(rawData as unknown as Record<string, string>);
          const customData = rawData as Record<string, unknown>;

          if (
            typeof customData.bloodRequestId === 'string' &&
            typeof customData.donorMatchId === 'string' &&
            typeof customData.recipientId === 'string'
          ) {
            navigate('ChatThread', {
              bloodRequestId: customData.bloodRequestId,
              donorMatchId: customData.donorMatchId,
              recipientId: customData.recipientId,
            });
            return;
          }

          const requestId = parsed.relatedRequestId || (typeof customData.requestId === 'string' ? customData.requestId : undefined);

          if (requestId) {
            navigate('DonorRequestDetail', { requestId });
            return;
          }

          navigate('Notifications');
        });

        removeReceivedListener = () => receivedSub.remove();
        removeResponseListener = () => responseSub.remove();
      } catch (error) {
        if (__DEV__) {
          console.warn('[push] failed to initialize notification handler:', error);
        }
      }
    };

    void setupNotifications();

    return () => {
      isMounted = false;
      removeReceivedListener?.();
      removeResponseListener?.();
    };
  }, []);
}
