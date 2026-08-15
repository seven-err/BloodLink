# BloodLink Supabase Backend Setup

This guide implements Task 1.2 for a manually created Supabase project.

## 1. Create the Supabase project

1. Open the Supabase dashboard.
2. Create a new project named `BloodLink`.
3. Select the Singapore region.
4. Save the project URL and anon public key.

## 2. Configure local environment

1. Copy `.env.example` to `.env.local`.
2. Fill these values:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_NOMINATIM_URL`
   - `EXPO_PUBLIC_OSRM_URL`
   - `EXPO_PUBLIC_OSM_USER_AGENT`
3. Keep `.env.local` private. It is ignored by Git.

## 3. Enable authentication

In Supabase Dashboard > Authentication > Providers:

1. Enable Email provider.
2. Enable Phone provider (no Twilio required when using the Send SMS Hook below).
3. Enable Google provider (Web client ID + optional iOS/Android client IDs from Google Cloud Console).
4. Configure MensaHero SMS delivery (section 3a) before relying on phone OTP in the app.

### 3a. MensaHero SMS (Send SMS Hook)

BloodLink sends phone OTPs through a Supabase Edge Function (`send-sms`) that calls [MensaHero](https://openmensahero.web.app).

**Dashboard quirk:** Phone provider save can require Twilio fields even when using the SMS Hook ([supabase#45198](https://github.com/supabase/supabase/issues/45198)). Use this order:

1. Keep **Send SMS Hook disabled** for a moment.
2. Authentication → Providers → Phone:
   - Enable Phone
   - SMS provider: Twilio
   - Enter dummy-but-valid placeholders (not real Twilio — unused at runtime):
     - Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
     - Auth Token: any non-empty string
     - Message Service SID: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save
3. Authentication → Hooks → **Send SMS**:
   - Enable HTTPS hook
   - URL: `https://qyfmmjxxttncmyetxczf.supabase.co/functions/v1/send-sms`
   - Generate / copy secret (`v1,whsec_...`)
4. Set Edge Function secrets (API key + device name should already be set):

```bash
npx supabase secrets set --project-ref qyfmmjxxttncmyetxczf \
  SEND_SMS_HOOK_SECRET=v1,whsec_xxx
```

5. Keep the MensaHero Android gateway online with device name matching `MENSAHERO_DEVICE_NAME` (currently `sev`).

Never put `MENSAHERO_API_KEY` or `SEND_SMS_HOOK_SECRET` in `EXPO_PUBLIC_*` env vars.

With the hook enabled, Auth ignores Twilio and calls MensaHero via `send-sms`.

### Google Sign-In (native in-app picker)

Mobile uses the Google Sign-In SDK (account chooser over the app). Web still uses browser OAuth.

1. In [Google Cloud Console](https://console.cloud.google.com/auth/clients), create:
   - **Web application** OAuth client (required — used as `webClientId` / ID token audience)
   - **Android** OAuth client — package `com.sevenerr.BloodLink` + your debug/release SHA-1
   - **iOS** OAuth client — bundle ID `com.sevenerr.BloodLink` (optional until you build iOS)
2. Authorized redirect URI on the **Web** client (for Supabase / web login):
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard > Authentication > Providers > Google:
   - Enable Google
   - Paste Web client ID + secret
   - Add Android / iOS client IDs (comma-separated) if prompted
   - Enable **Skip nonce check** for native iOS ID-token sign-in
4. App env (`.env` / `.env.local`):
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = Web client ID
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` = iOS client ID (iOS builds)
   - `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` = reversed iOS client ID, e.g. `com.googleusercontent.apps.1234-abcd`
5. Rebuild the native app after adding the plugin (this is **not** supported in Expo Go):

```bash
# Cloud (recommended if Android SDK is not installed locally)
npm run build:dev:android

# Or local
npx expo prebuild --clean
npx expo run:android
```

Install the new APK/dev client, then start Metro with `npx expo start` and open the **BloodLink** development build (not Expo Go).

For Android Google Sign-In, the OAuth Android client must use package `com.sevenerr.BloodLink` and the **SHA-1 of the keystore that signed the installed APK** (EAS credentials keystore for EAS builds, or your local debug keystore for `expo run:android`). Get the fingerprint with:

```bash
eas credentials -p android
```

Web redirect allow list (Authentication > URL Configuration):

- **Site URL:** `http://localhost:8081` (not `:3000` — wrong Site URL causes “cannot reach localhost”)
- `http://localhost:8081/**`
- `bloodlink://**`
- `exp://**`

Email confirmation uses a native deep link (`bloodlink://` / `exp://`) on device, or `http://localhost:8081/?email_confirmed=1` on Expo web. After confirm, the app shows **You're all set**. Resend the confirmation email after changing Redirect URLs — old links keep the previous address.

The app client stores sessions with `expo-secure-store` through `src/services/supabase/client.ts`.

## 4. Run database migration

In Supabase Dashboard > SQL Editor:

1. Run `supabase/migrations/202606040001_initial_backend.sql`.
2. Run `supabase/migrations/202606040002_phase_2_schema.sql`.
3. Run `supabase/migrations/202606040003_phase_3_profile_completion.sql`.
4. Confirm these tables exist:
   - `profiles`
   - `blood_requests`
   - `messages`
   - `notifications`
   - `notification_preferences`
   - `push_tokens`
   - `donations`
   - `availability`
   - `faqs`
   - `reports`
   - `analytics`
   - `donor_verifications`
   - `bloodbank_verifications`
   - `donor_matches`
5. Confirm `profiles.birthdate` exists for Phase 3 profile completion.
6. Confirm these relationships exist through `profiles.id`:
   - `profiles` to `donations`
   - `profiles` to `blood_requests`
   - `profiles` to `messages`
   - `profiles` to `notifications`
7. Confirm messaging is secure:
   - Only sender, recipient, or admin can read a message.
   - Only the sender or admin can create a message.
8. Confirm PostGIS is enabled.
9. Confirm RLS is enabled on all app tables.

## 5. Storage buckets

The migration creates these private buckets:

- `profile-images`
- `medical-documents`
- `blood-request-attachments`

Use owner-prefixed object paths, for example:

- `profile-images/{user_id}/avatar.jpg`
- `medical-documents/{user_id}/verification.pdf`
- `blood-request-attachments/{user_id}/{request_id}.pdf`

## 6. Realtime

The migration adds these tables to `supabase_realtime`:

- `blood_requests`
- `donor_matches`
- `notifications`

Client helpers live in `src/services/supabase/realtime.ts` and are user-scoped where possible.

## 7. OSM, Nominatim, and OSRM

Location wrappers live in `src/services/maps/osm.ts`.

Development defaults:

- Nominatim: `https://nominatim.openstreetmap.org`
- OSRM: `https://router.project-osrm.org`

For production, use compliant hosted services or self-hosted endpoints. Public OSM-family services have usage policies and should not be treated as unlimited app backend infrastructure.

## 8. Validation checklist

Run locally:

```bash
npm install
npx expo install --fix
npx tsc --noEmit
```

Manual Supabase checks:

- Email/password sign up and sign in works.
- Phone OTP request and verification works.
- User session persists after app restart.
- A user cannot read another user's private rows.
- A donor can see eligible open requests.
- A recipient can manage only their own requests.
- User notifications arrive via realtime only for that user.
- Geocoding, reverse geocoding, and route calculation return expected results.

## References

- Expo SDK 54: https://docs.expo.dev/versions/v54.0.0/
- Supabase React Native auth: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime: https://supabase.com/docs/guides/realtime/postgres-changes
