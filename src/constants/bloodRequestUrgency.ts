import type { BloodRequestUrgency } from '@/types/database';

export const BLOOD_REQUEST_URGENCIES: BloodRequestUrgency[] = [
  'normal',
  'urgent',
  'critical',
];

export const URGENCY_LABELS: Record<BloodRequestUrgency, string> = {
  critical: 'Critical',
  normal: 'Normal',
  urgent: 'Urgent',
};
