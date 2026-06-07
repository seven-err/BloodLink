import { sanitizeAuthError } from '@/utils/authErrors';

const VERIFICATION_REQUIRED_PATTERN = /verified before becoming available/i;

export const sanitizeProfileError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && VERIFICATION_REQUIRED_PATTERN.test(error.message)) {
    return 'You must be verified before turning on availability.';
  }

  return sanitizeAuthError(error, fallback);
};
