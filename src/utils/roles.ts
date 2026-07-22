import type { UserRole } from '@/types/database';

export type MobileAppRole = Extract<UserRole, 'donor' | 'recipient'>;

export const isMobileAppRole = (
  role: UserRole | null | undefined,
): role is MobileAppRole => role === 'donor' || role === 'recipient';

export const isBloodbankRole = (role: UserRole | null | undefined): boolean =>
  role === 'bloodbank';

export const isAdminRole = (role: UserRole | null | undefined): boolean => role === 'admin';

/** Staff roles that use the web dashboard for privileged ops. Blood bank can also use mobile. */
export const isStaffRole = (role: UserRole | null | undefined): boolean =>
  role === 'admin' || role === 'bloodbank';