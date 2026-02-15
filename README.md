# Gym LogBook

A React + TypeScript + Supabase application for tracking gym exercises and workout progress. Use it on your phone while at the gym!

## Features

- 🏋️ Track exercises with sets, reps, and weight
- 📅 View workouts organized by week
- 🎯 Set and track exercise goals
- 📋 Create reusable workout templates
- 🔄 Copy last week's weights for easy progressive overload
- ⚖️ **Weight carry-over** — templates auto-fill last used weights
- 📊 **Exercise progress comparison** — see previous performance inline
- 📈 **Analytics dashboard** — strength graphs, volume trends, weekly comparison
- 🏆 **Personal records (PR)** — automatic detection and tracking
- 💰 **Optional AdSense** — open source friendly, env-controlled monetization
- ☁️ Cloud data storage with Supabase
- 🔐 Secure user authentication
- 🎨 Multiple color themes (Blue, Red, Slate)
- 📱 Mobile-friendly responsive design
- 💾 PWA support — install on your phone!
- 🛡️ Row Level Security on all tables
- ⚡ Optimised Supabase queries with proper indexing

## Tech Stack

- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Styling
- **Supabase** — Backend & database (PostgreSQL)
- **Recharts** — Analytics charts
- **Vercel** — Hosting platform
- **date-fns** — Date utilities

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions.

Quick version:

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run `supabase/schema.sql` in SQL Editor
4. Run `supabase/templates_migration.sql`
5. Run `supabase/migrations/20251206_add_exercise_goals.sql`
6. Run `supabase/migrations/20260214_analytics_prs_security.sql`
7. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Optional monetization variables (only for hosted production):

```env
VITE_ENABLE_ADS=true
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
VITE_ADSENSE_SLOT_ID=XXXXXXXXXX
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide to Vercel.

**TLDR:**

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Your app will be accessible on your phone at your Vercel URL.

## Architecture

### Template System

- Create reusable workout templates with exercises, sets, reps, and default weights
- **Weight carry-over**: When creating a workout from a template, the system finds the last weight used for each exercise and pre-fills it. Falls back to template defaults if no history exists
- Users can always edit pre-filled values

### Progress Tracking

- Each exercise card shows the most recent previous occurrence (excluding current workout)
- Matches by exercise name (case-insensitive)
- Shows weight, reps, and week/day reference
- Trend indicators: ↑ improved, ↓ lower, → same

### Analytics System

- **Strength Progress**: Line chart of max weight over time per exercise
- **Volume Trends**: Bar chart of weekly total volume (weight × reps)
- **Weekly Comparison**: Side-by-side comparison of last two weeks
- **PR Timeline**: Chronological list of personal records
- All data computed in `src/lib/analytics.ts` service layer — never in components

### PR System

- Automatic detection when a set's weight exceeds the previous max
- Records stored in `personal_records` table
- Small "PR" badge displayed in the workout view
- PR timeline available on the Analytics page

### Monetization Model

- App remains fully open source
- Ads only enabled when `VITE_ENABLE_ADS=true` **AND** running in production mode
- Self-hosted users simply omit the env variable to disable ads
- AdSense publisher/slot IDs configured via environment variables — never hardcoded
- Safe ad placement: bottom of week pages, between sections — never inside forms or blocking UX

## Database Structure

```
exercises
  ├── id (uuid)
  ├── user_id (references auth.users)
  ├── name (text)
  └── created_at (timestamp)

workouts
  ├── id (uuid)
  ├── user_id (references auth.users)
  ├── date (date)
  ├── title (text, optional)
  ├── notes (text, optional)
  └── created_at (timestamp)

workout_exercises
  ├── id (uuid)
  ├── workout_id (references workouts)
  ├── exercise_id (references exercises)
  ├── notes (text, optional)
  └── order_index (integer)

sets
  ├── id (uuid)
  ├── workout_exercise_id (references workout_exercises)
  ├── reps (integer)
  ├── weight (numeric)
  └── order_index (integer)

exercise_goals
  ├── id (uuid)
  ├── user_id (references auth.users)
  ├── exercise_id (references exercises)
  ├── target_reps (integer, optional)
  ├── target_weight (numeric, optional)
  └── created_at (timestamp)

workout_templates
  ├── id (uuid)
  ├── user_id (references auth.users)
  ├── name (text)
  ├── description (text, optional)
  └── created_at (timestamp)

template_exercises
  ├── id (uuid)
  ├── template_id (references workout_templates)
  ├── exercise_id (references exercises)
  ├── target_sets (integer)
  ├── target_reps (integer, optional)
  ├── target_weight (numeric, optional)
  └── order_index (integer)

personal_records
  ├── id (uuid)
  ├── user_id (references auth.users)
  ├── exercise_name (text)
  ├── weight (numeric)
  ├── reps (integer)
  ├── date (date)
  └── created_at (timestamp)
```

## Supabase Security & Performance

### Row Level Security (RLS)

All public tables have RLS enabled. Users can only access their own data:

- `exercises` — filter by `user_id`
- `workouts` — filter by `user_id`
- `workout_exercises` — filter via parent workout's `user_id`
- `sets` — filter via grandparent workout's `user_id`
- `workout_templates` — filter by `user_id`
- `template_exercises` — filter via parent template's `user_id`
- `exercise_goals` — filter by `user_id`
- `personal_records` — filter by `user_id`

### Indexing

Indexes are applied on frequently queried columns:

- `user_id` on all user-owned tables
- `date` on workouts
- `workout_id` on workout_exercises
- `exercise_id` on workout_exercises and exercise_goals
- `created_at` on sets, workout_exercises
- `exercise_name` and `date` on personal_records

### Function Security

All PL/pgSQL functions use `SECURITY DEFINER` with explicit `SET search_path = public` to prevent mutable search_path warnings.

## Security & Payment Handling Policy

- The app **never** handles credit card information directly
- No payment credentials, bank info, or API secret keys stored in frontend
- All environment variables for sensitive keys — never hardcoded
- Authentication uses official Supabase SDK with session management
- If Stripe is ever used in the future: use Stripe Checkout / Payment Links only — never collect card details manually
- All payments must be handled server-side — never build custom payment processing

## Roadmap

Future improvements:

- 📤 Export workout history
- 🔔 Workout reminders
- 🏅 Achievement badges
- 📱 Native app versions

## Contributing

Feel free to fork and customize for your own use! This project is open source and contributions are welcome.

## License

MIT
