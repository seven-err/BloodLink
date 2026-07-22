# BloodLink Agent Guide

## Project Name

BloodLink: Smart Blood Donor Matching System

## Project Description

BloodLink is a mobile healthcare system that improves emergency blood donation coordination through intelligent donor matching, real-time donor availability, location-based search, QR code verification, notifications, and healthcare/admin communication.

## Primary Stack

* React Native / Expo
* TypeScript
* Supabase Auth
* Supabase Database
* Supabase Storage
* Supabase Realtime
* OpenStreetMap for maps
* Optional backend/serverless functions for protected operations
* GitHub for version control

## Main User Roles

1. Donor
2. Recipient / Patient requester
3. Healthcare personnel / Blood bank personnel / PRC personnel
4. Administrator

## Core Modules

### 1. Authentication and Profile Management

Users can register and log in using phone OTP, Google authentication, and email/password. Each user must have a role-based profile.

### 2. Donor Registration and Availability

Donors can manage blood type, eligibility status, location, donation history, and real-time availability.

### 3. Blood Request Management

Recipients or healthcare personnel can create blood requests with blood type, urgency level, hospital/location, units needed, notes, and request status.

### 4. Smart Donor Matching

The system ranks compatible donors based on blood compatibility, location/proximity, availability, eligibility, urgency, and recent donation restrictions.

### 5. Map and Location Features

The system uses OpenStreetMap to show nearby donors, request locations, healthcare facilities, and route/location context.

### 6. QR Code Donation Verification

The system generates and scans QR codes to verify donor identity, donation sessions, and donation completion records.

### 7. Notifications

The system sends alerts for emergency blood requests, donor match results, status changes, reminders, and admin updates.

### 8. Real-Time Chat or Messaging

Donors, requesters, and authorized healthcare personnel can communicate through controlled real-time messaging.

### 9. Admin and Healthcare Dashboard

Authorized users can manage requests, donors, verification records, analytics, user reports, and system monitoring.

### 10. Analytics

The system can show request trends, donor response rate, blood type demand, fulfilled requests, pending requests, and location-based demand patterns.

## Architecture Rules

* Keep mobile app code clean and modular.
* Do not put business logic directly inside screens when it can be placed in hooks, services, or utilities.
* Use `/src/components` for reusable UI.
* Use `/src/screens` or `/app` for route screens depending on the project structure.
* Use `/src/services` for Supabase and API logic.
* Use `/src/hooks` for reusable stateful logic.
* Use `/src/types` for shared TypeScript types.
* Use `/src/utils` for pure helper functions.
* Use `/src/constants` for fixed values such as blood types and role names.

## Suggested Folder Structure

```txt
src/
  components/
    common/
    forms/
    maps/
    blood/
    qr/
  screens/
    auth/
    donor/
    recipient/
    healthcare/
    admin/
  navigation/
  hooks/
  services/
    supabase/
    auth/
    donors/
    requests/
    matching/
    notifications/
    chat/
    qr/
  types/
  utils/
  constants/
  lib/
```

## Coding Standards

* Use TypeScript.
* Avoid `any` unless there is a clear reason.
* Use named exports for reusable modules.
* Keep components small and focused.
* Use clear file names.
* Add validation before saving data.
* Handle loading, success, error, and empty states.
* Avoid hardcoded secrets.
* Never expose service-role keys in client-side code.
* Use Supabase Row Level Security for sensitive tables.
* Keep healthcare-related data protected.

## Supabase Rules

* Check existing schema before writing SQL.
* Use migrations or SQL scripts for table changes.
* Enable RLS on user-sensitive tables.
* Create policies per role.
* Use `auth.uid()` for ownership checks.
* Use server-side logic for privileged operations.
* Do not trust client-side role checks alone.

## Blood Matching Rules

Compatibility should consider ABO and Rh factor.

Donor-to-recipient compatibility:

* O- can donate to all blood types.
* O+ can donate to positive blood types.
* A- can donate to A-, A+, AB-, AB+.
* A+ can donate to A+ and AB+.
* B- can donate to B-, B+, AB-, AB+.
* B+ can donate to B+ and AB+.
* AB- can donate to AB- and AB+.
* AB+ can donate to AB+.

Ranking should consider:

1. Blood compatibility.
2. Urgency level.
3. Distance/proximity.
4. Donor availability.
5. Eligibility status.
6. Last donation date.
7. Response history, if available.

## Quality Checklist

Before completing any implementation:

* Run TypeScript check if configured.
* Run lint if configured.
* Run tests if configured.
* Verify imports.
* Verify navigation paths.
* Verify Supabase calls.
* Verify error states.
* Verify role restrictions.
* Summarize changed files.

## Common Commands

```bash
npm install
npx expo start
npm run lint
npm run typecheck
npm test
```

If a command does not exist, inspect package.json and suggest adding the correct script.

## Agent Behavior

* First inspect, then plan, then implement.
* Do not rewrite the whole project for small tasks.
* Do not remove existing features without explanation.
* Prefer incremental changes.
* Use clear commit-sized edits.
* When uncertain, choose the safest healthcare-grade implementation.
* Always explain database/security impact.
