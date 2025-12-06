# Gym LogBook

A React + TypeScript + Supabase application for tracking gym exercises and workout progress. Use it on your phone while at the gym!

## Features

- ��� Track exercises with sets, reps, and weight
- ��� View workouts organized by week
- ��� Cloud data storage with Supabase
- ��� Secure user authentication
- ��� Modern UI with Tailwind CSS
- ��� Mobile-friendly responsive design
- ��� Deployable to Vercel (free hosting!)

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend & database (PostgreSQL)
- **Vercel** - Hosting platform
- **date-fns** - Date utilities

## Project Structure

```
src/
  ├── lib/
  │   ├── api.ts        # Supabase API functions (workouts, exercises)
  │   ├── auth.ts       # Authentication utilities
  │   ├── supabase.ts   # Supabase client configuration
  │   ├── storage.ts    # localStorage utilities (fallback)
  │   └── utils.ts      # Helper functions (cn for classnames)
  ├── types/
  │   └── index.ts      # TypeScript type definitions
  ├── App.tsx           # Main app component
  └── main.tsx          # Entry point
supabase/
  └── schema.sql        # Database schema & RLS policies
```

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
4. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
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
```

## API Usage Examples

### Authentication

```typescript
import { auth } from '@/lib/auth';

// Sign up
await auth.signUp('email@example.com', 'password');

// Sign in
await auth.signIn('email@example.com', 'password');

// Sign out
await auth.signOut();

// Get current user
const user = await auth.getCurrentUser();
```

### Managing Exercises

```typescript
import { exerciseApi } from '@/lib/api';

// Get all exercises
const exercises = await exerciseApi.getAll();

// Create exercise
const exercise = await exerciseApi.create('Bench Press');

// Update exercise
await exerciseApi.update(exerciseId, 'Incline Bench Press');

// Delete exercise
await exerciseApi.delete(exerciseId);
```

### Managing Workouts

```typescript
import { workoutApi } from '@/lib/api';

// Get workouts grouped by week
const weeks = await workoutApi.getByWeeks();

// Create a workout
await workoutApi.create({
  date: '2025-12-06',
  title: 'Push Day',
  exercises: [
    {
      exercise_id: 'bench-press-id',
      sets: [
        { reps: 10, weight: 135 },
        { reps: 8, weight: 155 },
        { reps: 6, weight: 175 }
      ]
    }
  ]
});

// Get specific workout
const workout = await workoutApi.getById(workoutId);

// Delete workout
await workoutApi.delete(workoutId);
```

## Utilities

### Class Name Merger

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  "hover:bg-blue-500"
)} />
```

### Date Utilities

```typescript
import { format, startOfWeek, endOfWeek } from 'date-fns';

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
const formatted = format(new Date(), 'yyyy-MM-dd');
```

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase Auth
- API keys stored in environment variables (never in code)

## Free Tier Limits

**Supabase:**
- 500 MB database
- 2 GB bandwidth/month
- Unlimited API requests
- Perfect for personal use!

**Vercel:**
- 100 GB bandwidth/month
- Unlimited deployments
- Free SSL certificates

## Next Steps

1. Build authentication UI (login/signup)
2. Create exercise management page
3. Add workout logging form
4. Build weekly workout view
5. Create individual workout detail view
6. Add progress charts and statistics
7. Add PWA support for offline access

## Contributing

Feel free to fork and customize for your own use!

## License

MIT
