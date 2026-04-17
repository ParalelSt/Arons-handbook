# Gym LogBook

A Next.js + TypeScript + Supabase app for tracking gym workouts, templates, goals, and progress. Built mobile-first — use it on your phone at the gym.

## Features

- Track exercises with sets, reps, and weight
- Month calendar view of workouts with per-day indicators
- Weekly workout templates with per-day overrides
- Exercise and day libraries for quick reuse
- Exercise goals with line charts and target reference
- Analytics dashboard — strength graphs, volume trends, weekly comparison
- Personal records (PR) — automatic detection and timeline
- Weight carry-over — templates auto-fill last used weights
- Email/password and Google sign-in via Supabase Auth
- 5 color themes (Midnight, Crimson, Forest, Ember, Slate)
- Responsive layout — bottom tabs on mobile, sidebar on desktop
- PWA support — installable on phone, offline caching
- Row Level Security on all tables

## Tech Stack

- **Next.js 16** (App Router, Turbopack) — framework + build
- **React 19** — UI
- **TypeScript** — type safety
- **Tailwind CSS 4** — styling
- **Supabase** — Postgres + Auth
- **Recharts** — analytics charts
- **date-fns** — date utilities
- **@ducanh2912/next-pwa** — PWA / service worker
- **Vercel** — hosting

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions. Short version:

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor run, in order:
   - `supabase/schema.sql`
   - `supabase/templates_migration.sql`
   - `supabase/migrations/20251206_add_exercise_goals.sql`
   - `supabase/migrations/20260214_analytics_prs_security.sql`
   - `supabase/migrations/20260215_exercise_day_library.sql`
   - `supabase/migrations/20260215_weekly_templates_analytics_rpc.sql`
3. (Optional) Enable Google provider under **Authentication → Providers**
4. Copy the project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Dev Server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Production Build

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo into Vercel — framework auto-detects as Next.js
3. Add env vars in **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

If you use Supabase email confirmation, add your production URL to **Supabase → Authentication → URL Configuration → Redirect URLs** (e.g. `https://your-app.vercel.app/login`).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full walkthrough.

## Architecture

### Routing

- `src/app/login/page.tsx` — auth page (outside the dashboard shell)
- `src/app/(dashboard)/layout.tsx` — auth guard + responsive nav shell
- `src/app/(dashboard)/page.tsx` — home (month calendar)
- `src/app/(dashboard)/week/[weekStart]/page.tsx` — week detail
- `src/app/(dashboard)/workout/[id]/page.tsx` — workout detail + edit
- `src/app/(dashboard)/templates/` — template list + editor
- `src/app/(dashboard)/goals/`, `analytics/`, `exercises/`, `settings/`, `support/`

### Auth

Supabase uses localStorage sessions, so auth is guarded in a client layout rather than Next middleware. `AuthProvider` exposes the current user; `(dashboard)/layout.tsx` redirects to `/login` when signed out.

### Template System

- Weekly templates hold 7 day slots; each slot can assign a day template
- Assigning a day template to a date with an existing workout replaces it (progression is date-based, so it stays consistent)
- Weight carry-over: new workouts pre-fill with the last weight used for each exercise, falling back to the template default

### Progress Tracking

- Each exercise shows the most recent previous occurrence
- Query filters by `date < currentWorkoutDate` AND at least one set with `weight > 0` — no comparison against empty or future workouts
- Implemented in `src/lib/progression.ts`

### Analytics

- Strength progress — max weight per exercise over time
- Volume trends — weekly `weight × reps` totals
- Weekly comparison — last two **completed** weeks (skips the in-progress week)
- PR timeline — chronological personal records
- All logic lives in `src/lib/analyticsService.ts`, never in components

### Themes

5 themes via CSS custom properties on `<html data-theme>`:

| Key | Accent | Surface |
|---|---|---|
| `midnight` | Blue | Slate |
| `crimson` | Red | Black |
| `forest` | Green | Dark green |
| `ember` | Amber | Dark brown |
| `slate` | Gray | Charcoal |

### PWA

`@ducanh2912/next-pwa` generates the service worker into `public/` at build time. Icons and manifest live in `public/`.

## Database

```
exercises
  id, user_id, name, muscle_group, default_reps, default_weight, created_at

workouts
  id, user_id, date, title, notes, created_at

workout_exercises
  id, workout_id, exercise_id, order_index, notes

sets
  id, workout_exercise_id, reps, weight, order_index

workout_templates          — weekly templates
template_day_assignments   — day-of-week → day template
day_templates              — reusable day blocks
day_template_exercises     — exercises inside a day template

exercise_goals
  id, user_id, exercise_id, target_reps, target_weight, created_at

personal_records
  id, user_id, exercise_name, weight, reps, date, created_at
```

Consult the migration files in `supabase/migrations/` for the authoritative schema.

## Security & Performance

### Row Level Security

RLS is enabled on every table. Users only see their own rows:
- Direct `user_id` filter on `exercises`, `workouts`, templates, `exercise_goals`, `personal_records`
- Transitive filter (via parent) on `workout_exercises`, `sets`, `template_exercises`

### Indexing

- `user_id` on all user-owned tables
- `date` on `workouts`
- `workout_id` on `workout_exercises`
- `exercise_id` on `workout_exercises` and `exercise_goals`
- `exercise_name`, `date` on `personal_records`

### Function Security

All PL/pgSQL functions use `SECURITY DEFINER` with an explicit `SET search_path = public`.

## Payments

The app does not and will not handle payment data directly. If a payment flow is ever added, it will use hosted checkout (Stripe Checkout / Payment Links) — no card data in the frontend, no custom processing.

## Contributing

Fork it, customize it, PRs welcome.

## License

MIT
