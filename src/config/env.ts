const requireEnv = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  authRedirectUrl: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  apiBaseUrl: requireEnv('EXPO_PUBLIC_API_URL', 'http://localhost:3001'),
  nominatimBaseUrl: requireEnv(
    'EXPO_PUBLIC_NOMINATIM_URL',
    'https://nominatim.openstreetmap.org',
  ),
  osrmBaseUrl: requireEnv(
    'EXPO_PUBLIC_OSRM_URL',
    'https://router.project-osrm.org',
  ),
  osmUserAgent: requireEnv(
    'EXPO_PUBLIC_OSM_USER_AGENT',
    'BloodLink/1.0',
  ),
} as const;
