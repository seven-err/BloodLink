# BloodLink

BloodLink is a mobile blood-donation coordination system built with Expo and React Native. It connects donors, recipients, and blood banks through role-based onboarding, blood-request matching, location-aware discovery, notifications, messaging, donation tracking, and verification workflows.

## Technology stack

- Expo SDK 54 and React Native
- TypeScript
- Supabase for authentication, PostgreSQL, storage, and realtime updates
- Express and Nodemailer for email delivery
- OpenStreetMap, Nominatim, and OSRM for location services

## Prerequisites

- Node.js and npm
- Expo Go or an Android/iOS emulator
- A Supabase project

## Local setup

1. Install the app dependencies:

   ```bash
   npm install
   ```

2. Install the email server dependencies:

   ```bash
   npm --prefix server install
   ```

3. Create `.env.local` in the project root:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_API_URL=http://localhost:3001
   EXPO_PUBLIC_AUTH_REDIRECT_URL=bloodlink://
   EXPO_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org
   EXPO_PUBLIC_OSRM_URL=https://router.project-osrm.org
   EXPO_PUBLIC_OSM_USER_AGENT=BloodLink/1.0
   ```

4. Configure Supabase and apply the migrations in `supabase/migrations`. See [Supabase setup](docs/supabase-setup.md) for the complete procedure.

5. Configure the email server if needed. See [Nodemailer setup](docs/nodemailer.md).

## Run the system

Start the mobile app:

```bash
npm start
```

In a second terminal, start the email server:

```bash
npm --prefix server run dev
```

You can also launch a specific app target with `npm run android`, `npm run ios`, or `npm run web`.

## Quality checks

Run all TypeScript, lint, and server test checks:

```bash
npm run check
```

## Project structure

```text
src/                  Application source code
  components/         Reusable interface components
  navigation/         Role-based app navigation
  screens/            Authentication and feature screens
  services/           Supabase, maps, location, and email clients
  utils/              Validation and domain helpers
server/               Express email service
supabase/migrations/  Database schema and security migrations
docs/                 Setup and workflow guides
```

## Security notes

- Never commit `.env` or `.env.local` files.
- Use only the Supabase anonymous key in the mobile app; never expose a service-role key.
- Review row-level security policies and production provider limits before deployment.

## Git workflow

See [Git workflow](docs/git-workflow.md) for the project's branch and commit conventions.
