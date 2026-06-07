import type { UserRole } from '@/types/database';

export type MobileAppRole = Extract<UserRole, 'donor' | 'recipient'>;

export const isMobileAppRole = (
  role: UserRole | null | undefined,
): role is MobileAppRole => role === 'donor' || role === 'recipient';

export const isStaffRole = (role: UserRole | null | undefined): boolean =>
  role === 'admin' || role === 'bloodbank';
