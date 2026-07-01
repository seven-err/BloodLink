import type { LucideIcon } from 'lucide-react-native';
import {
  AlertCircle,
  Bell,
  Calendar,
  Heart,
  Megaphone,
  MessageCircle,
} from 'lucide-react-native';

import { colors } from '@/constants/theme';
import type { AppNotification } from '@/services/supabase/notifications';
import { parseNotificationData } from '@/utils/notificationData';

export type NotificationFilter = 'all' | 'unread' | 'important';

export type NotificationVisual = {
  Icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  isHighPriority: boolean;
};

const readPriority = (notification: AppNotification) => {
  if (!notification.data || typeof notification.data !== 'object' || Array.isArray(notification.data)) {
    return undefined;
  }

  const priority = (notification.data as Record<string, unknown>).priority;
  return typeof priority === 'string' ? priority.toLowerCase() : undefined;
};

export const getNotificationVisual = (notification: AppNotification): NotificationVisual => {
  const priority = readPriority(notification);
  const isCritical =
    priority === 'critical' ||
    priority === 'high' ||
    priority === 'urgent' ||
    notification.title.toLowerCase().includes('critical');

  switch (notification.type) {
    case 'blood_request':
      return {
        Icon: AlertCircle,
        iconBackground: colors.primarySoft,
        iconColor: colors.primary,
        isHighPriority: true,
      };
    case 'donor_match':
      return {
        Icon: Heart,
        iconBackground: colors.primarySoft,
        iconColor: colors.primary,
        isHighPriority: true,
      };
    case 'donation':
      return {
        Icon: Calendar,
        iconBackground: colors.successSoft,
        iconColor: colors.success,
        isHighPriority: isCritical,
      };
    case 'verification':
      return {
        Icon: Calendar,
        iconBackground: colors.successSoft,
        iconColor: colors.success,
        isHighPriority: false,
      };
    case 'system':
      if (
        notification.title.toLowerCase().includes('message') ||
        notification.body.toLowerCase().includes('message')
      ) {
        return {
          Icon: MessageCircle,
          iconBackground: colors.infoSoft,
          iconColor: colors.info,
          isHighPriority: false,
        };
      }

      if (
        notification.title.toLowerCase().includes('status') ||
        notification.title.toLowerCase().includes('update')
      ) {
        return {
          Icon: Bell,
          iconBackground: colors.orangeSoft,
          iconColor: colors.orangeText,
          isHighPriority: false,
        };
      }

      return {
        Icon: Megaphone,
        iconBackground: '#ede9fe',
        iconColor: '#7c3aed',
        isHighPriority: false,
      };
    default:
      return {
        Icon: Bell,
        iconBackground: colors.background,
        iconColor: colors.muted,
        isHighPriority: false,
      };
  }
};

export const isImportantNotification = (notification: AppNotification) => {
  const visual = getNotificationVisual(notification);
  const related = parseNotificationData(notification.data);

  return (
    visual.isHighPriority ||
    notification.type === 'blood_request' ||
    notification.type === 'donor_match' ||
    Boolean(related.relatedRequestId)
  );
};

export const filterNotifications = (
  notifications: AppNotification[],
  filter: NotificationFilter,
) => {
  switch (filter) {
    case 'unread':
      return notifications.filter((notification) => notification.read_at === null);
    case 'important':
      return notifications.filter((notification) => isImportantNotification(notification));
    default:
      return notifications;
  }
};
