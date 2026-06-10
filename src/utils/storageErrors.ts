import { sanitizeAuthError } from '@/utils/authErrors';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return '';
};

export const sanitizeStorageError = (error: unknown, fallback: string): string => {
  const message = getErrorMessage(error).trim();

  if (/row-level security|permission denied|not authorized/i.test(message)) {
    return 'Upload not allowed. Please sign in again and retry.';
  }

  if (/payload too large|file size|too large/i.test(message)) {
    return 'File is too large. Choose an image under 5 MB.';
  }

  if (/invalid mime|mime type|not allowed/i.test(message)) {
    return 'Unsupported file type. Use JPEG, PNG, or WebP.';
  }

  if (/unable to read the selected/i.test(message)) {
    return message;
  }

  return sanitizeAuthError(error, fallback);
};
