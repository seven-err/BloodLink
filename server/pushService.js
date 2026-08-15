const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Validates whether a token string is a valid Expo push token format.
 */
function isExpoPushToken(token) {
  return (
    typeof token === 'string' &&
    ((token.startsWith('ExponentPushToken[') && token.endsWith(']')) ||
      (token.startsWith('ExpoPushToken[') && token.endsWith(']')))
  );
}

/**
 * Sends push notification messages via Expo's Push API.
 * @param {Array<{ to: string, title: string, body: string, data?: object, sound?: string, priority?: string, channelId?: string }>} messages
 * @param {{ expoAccessToken?: string, fetchImpl?: typeof fetch }} options
 */
async function sendExpoPushNotifications(messages, { expoAccessToken, fetchImpl = fetch } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { data: [], tickets: [] };
  }

  const validMessages = messages.filter((m) => m && isExpoPushToken(m.to));
  if (validMessages.length === 0) {
    return { data: [], tickets: [], invalidTokens: messages.map((m) => m.to) };
  }

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };

  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const response = await fetchImpl(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(validMessages),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.message ||
      payload?.message ||
      `Expo push request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

/**
 * Queries the Supabase database for all push tokens associated with a given user.
 */
async function getUserPushTokens(
  userId,
  { supabaseUrl, apiKey, accessToken, fetchImpl = fetch } = {},
) {
  if (!userId || typeof userId !== 'string') {
    return [];
  }

  const baseUrl = (supabaseUrl || '').replace(/\/$/, '');
  if (!baseUrl || !apiKey) {
    throw new Error('Supabase configuration missing for push tokens lookup.');
  }

  const url = `${baseUrl}/rest/v1/push_tokens?user_id=eq.${encodeURIComponent(userId)}&select=token,platform`;
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${accessToken || apiKey}`,
    'Content-Type': 'application/json',
  };

  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch push tokens: ${response.status} ${text}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((r) => r.token).filter(isExpoPushToken) : [];
}

module.exports = {
  EXPO_PUSH_URL,
  isExpoPushToken,
  sendExpoPushNotifications,
  getUserPushTokens,
};
