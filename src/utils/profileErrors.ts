import { sanitizeAuthError } from '@/utils/authErrors';

const VERIFICATION_REQUIRED_PATTERN = /verified before becoming available/i;
const MAP_VISIBILITY_PATTERNS = [
  {
    pattern: /add a location to your profile before appearing on the donor map/i,
    message: 'Add a location to your profile before appearing on the donor map.',
  },
  {
    pattern: /verified donors can appear on the donor map/i,
    message: 'You must be verified before you can appear on the donor map.',
  },
  {
    pattern: /only donors can appear on the donor map/i,
    message: 'Only donor accounts can appear on the donor map.',
  },
  {
    pattern: /visible_on_map/i,
    message:
      'Map visibility is not available yet. Apply the latest database migration, then try again.',
  },
] as const;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : '';
  }

  return '';
};

export const sanitizeProfileError = (error: unknown, fallback: string): string => {
  const message = getErrorMessage(error);

  if (VERIFICATION_REQUIRED_PATTERN.test(message)) {
    return 'You must be verified before turning on availability.';
  }

  for (const rule of MAP_VISIBILITY_PATTERNS) {
    if (rule.pattern.test(message)) {
      return rule.message;
    }
  }

  return sanitizeAuthError(error, fallback);
};
