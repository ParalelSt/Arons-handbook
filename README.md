# Gym LogBook

A React + TypeScript + Supabase application for tracking gym exercises and workout progress. Use it on your phone while at the gym!

## Features

- 🏋️ Track exercises with sets, reps, and weight
- 📅 View workouts organized by week
- 🎯 Set and track exercise goals
- 📋 Create reusable workout templates
- 🔄 Copy last week's weights for easy progressive overload
- ☁️ Cloud data storage with Supabase
- 🔐 Secure user authentication
- 🎨 Multiple color themes (Blue, Red, Slate)
- 📱 Mobile-friendly responsive design
- 💾 PWA support - install on your phone!

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend & database (PostgreSQL)
- **Vercel** - Hosting platform
- **date-fns** - Date utilities

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
```

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase Auth
- API keys stored in environment variables (never in code)

## Roadmap

Future improvements:

- 📊 Progress charts and statistics
- 🏆 Personal Records (PRs) tracking
- 📤 Export workout history
- 🔔 Workout reminders

## Contributing

Feel free to fork and customize for your own use! This project is open source and contributions are welcome.

## License

MIT
