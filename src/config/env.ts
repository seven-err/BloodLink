/**
 * Expo's babel-preset-expo inlines EXPO_PUBLIC_* vars only when accessed
 * statically (e.g. process.env.EXPO_PUBLIC_SUPABASE_URL).  Dynamic bracket
 * access like process.env[name] is NOT transformed, which leaves the values
 * undefined in EAS production/preview builds.  Every EXPO_PUBLIC_ variable
 * must therefore be read with a static property access.
 */

const trim = (v: string | undefined): string | undefined =>
  v?.trim() ? v.trim() : undefined;

const supabaseUrl = trim(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = trim(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export const missingRequiredEnv = [
  !supabaseUrl ? 'EXPO_PUBLIC_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'EXPO_PUBLIC_SUPABASE_ANON_KEY' : null,
].filter((name): name is string => Boolean(name));

export const hasRequiredEnv = missingRequiredEnv.length === 0;

export const env = {
  authRedirectUrl: trim(process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL),
  googleWebClientId: trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  googleIosClientId: trim(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  // Empty strings keep createClient from throwing when config is incomplete;
  // App shows a boot screen via hasRequiredEnv instead of a silent crash.
  supabaseUrl: supabaseUrl ?? '',
  supabaseAnonKey: supabaseAnonKey ?? '',
  apiBaseUrl: trim(process.env.EXPO_PUBLIC_API_URL) ?? 'http://localhost:3001',
  nominatimBaseUrl:
    trim(process.env.EXPO_PUBLIC_NOMINATIM_URL) ?? 'https://nominatim.openstreetmap.org',
  osrmBaseUrl:
    trim(process.env.EXPO_PUBLIC_OSRM_URL) ?? 'https://router.project-osrm.org',
  osmUserAgent: trim(process.env.EXPO_PUBLIC_OSM_USER_AGENT) ?? 'BloodLink/1.0',
} as const;
