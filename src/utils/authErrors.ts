const SENSITIVE_PATTERNS = [
  /jwt/i,
  /token/i,
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /postgresql/i,
  /supabase/i,
  /row level security/i,
  /\brls\b/i,
  /\bcolumn\b/i,
  /\brelation\b/i,
  /\bschema\b/i,
  /\bsql\b/i,
];

const NETWORK_PATTERNS = /network|fetch failed|failed to fetch|timeout|offline/i;
const SESSION_PATTERNS = /session|expired|invalid.*refresh/i;

export const sanitizeAuthError = (error: unknown, fallback: string): string => {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message) {
    return fallback;
  }

  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  if (NETWORK_PATTERNS.test(message)) {
    return 'Unable to connect. Check your internet connection and try again.';
  }

  if (SESSION_PATTERNS.test(message)) {
    return 'Your session has expired. Please sign in again.';
  }

  if (message.length > 120 || message.includes('{') || /https?:\/\//i.test(message)) {
    return fallback;
  }

  return message;
};
