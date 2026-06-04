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
2. Enable Phone provider.
3. Keep Phone OTP on Supabase defaults for v1.
4. For production, configure a dedicated SMS provider and rate limits before launch.

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
   - `donations`
   - `availability`
   - `faqs`
   - `reports`
   - `analytics`
   - `donor_verifications`
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
