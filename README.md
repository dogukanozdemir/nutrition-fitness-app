# Nutrition & Fitness PWA

A mobile-first web app for tracking nutrition and fitness. Data ingestion is powered by a Custom GPT that calls the API; the app stores and visualizes.

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Framer Motion + Recharts
- Supabase (Postgres + Auth)

## Setup

1. Clone and install:

```bash
npm install
```

2. Create a Supabase project at [supabase.com](https://supabase.com).

3. Run the migrations in the Supabase SQL editor (in order):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_workout_entry_exercise.sql`

4. Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Start the dev server:

```bash
npm run dev
```

## Vercel Deployment

1. Connect your repo to Vercel.
2. Add the environment variables in Project Settings.
3. Deploy. No extra config needed.

## API Endpoints

### Auth (cookie session)

- `POST /api/v1/auth/register` – Register
- `POST /api/v1/auth/login` – Login
- `POST /api/v1/auth/logout` – Logout

### Ingestion (X-API-KEY header)

- `POST /api/v1/ingest/food` – Ingest food log
- `POST /api/v1/ingest/body` – Ingest body metrics
- `POST /api/v1/ingest/workout` – Ingest workout

### Read (cookie auth)

- `GET /api/v1/food/day?date=YYYY-MM-DD` – Food for a day
- `GET /api/v1/food/item/:id` – Food item detail
- `GET /api/v1/body/history?from=&to=` – Body metrics
- `GET /api/v1/workouts?from=&to=` – Workouts list
- `GET /api/v1/workouts/:id` – Workout detail
- `POST /api/v1/settings/api-keys` – Create API key
- `DELETE /api/v1/settings/api-keys/:id` – Revoke API key

### Delete (cookie auth or X-API-KEY)

- `DELETE /api/v1/food/item/:id` – Delete food item
- `DELETE /api/v1/body/:id` – Delete body metric
- `DELETE /api/v1/workouts/:id` – Delete workout

Delete endpoints accept either cookie session (app) or `X-API-KEY` header (GPT).

Create API keys in Settings. Use them in your Custom GPT with the `X-API-KEY` header. The ingest API supports full workout sessions (strength with exercise/sets, cardio with activity/duration/distance).
