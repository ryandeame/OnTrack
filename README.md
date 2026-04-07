# OnTrack

OnTrack is a React Native fitness and nutrition app built with Expo and Supabase. It helps users log meals, track calories and macros, record workouts, monitor daily food spend, and review short-term trends from a single mobile-first interface.

## Features

- Email sign-in and sign-up powered by Supabase Auth
- Daily summary screen with calories, protein, carbs, food spend, and date-based history
- Food logging flow with servings, grams, calories, carbs, protein, and optional cost tracking
- Food log history grouped by day
- Dashboard view for the last 10 days of calories and protein
- Exercise logging with name suggestions and quick prefill from previous entries
- Theme switching with multiple recovered visual palettes

## Tech Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Supabase

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Add your Supabase project values to `.env.local`.

4. Start the app:

   ```bash
   npm start
   ```

You can also run platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

## Environment Variables

The app currently expects these Expo public environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit local `.env` files or any private credentials such as Supabase service role keys.

## Supabase Notes

This app expects a Supabase backend that includes:

- Auth enabled for email/password sign-in
- A `food_logs` table
- An `exercise_logs` table
- An optional `get_dashboard_history` RPC used by the dashboard screen

If the RPC is missing, the dashboard falls back to querying `food_logs` directly.

## Project Structure

- `app/`: Expo Router screens and navigation
- `components/`: shared UI building blocks
- `context/`: auth and theme providers
- `hooks/`: Supabase-backed app logic
- `lib/`: shared utilities and client setup
- `constants/`: theme configuration

## Scripts

- `npm start`: start the Expo dev server
- `npm run android`: open Android
- `npm run ios`: open iOS
- `npm run web`: open web
- `npm run lint`: run lint checks

## Security

- Secrets are loaded from local environment files
- The public repo includes only a safe `.env.example`
- Internal recovery notes and machine-specific references are intentionally excluded
