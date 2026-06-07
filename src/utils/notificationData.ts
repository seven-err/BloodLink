import type { Json } from '@/types/database';

export type NotificationRelatedIds = {
  relatedRequestId?: string;
  relatedMatchId?: string;
  relatedDonationId?: string;
};

const readStringField = (record: Record<string, Json | undefined>, key: string) => {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const parseNotificationData = (data: Json): NotificationRelatedIds => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  const record = data as Record<string, Json | undefined>;

  return {
    relatedRequestId: readStringField(record, 'related_request_id'),
    relatedMatchId: readStringField(record, 'related_match_id'),
    relatedDonationId: readStringField(record, 'related_donation_id'),
  };
};
