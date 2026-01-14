# Gym LogBook - Deployment Guide

## 🚀 Quick Setup Guide

### 1. Create a Supabase Project (FREE)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Project Name**: gym-logbook
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait for project to initialize (~2 minutes)

### 2. Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" to create all tables and security policies

### 3. Enable Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (already enabled by default)
3. Optional: Enable **Google** or other providers for easier login

### 4. Get Your Supabase Credentials

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long string)

### 5. Configure Local Environment

1. Create a `.env` file in the project root:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 6. Test Locally

```bash
npm install
npm run dev
```

Visit http://localhost:5173 - your app should be running!

### 7. Deploy to Vercel (FREE)

1. **Push to GitHub**:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gym-logbook.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:

   - Go to [vercel.com](https://vercel.com) and sign up with GitHub
   - Click "New Project"
   - Import your `gym-logbook` repository
   - Add Environment Variables:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Deploy"

3. **Done!** Your app will be live at `https://your-app.vercel.app`

### 8. Access on Mobile

- Visit your Vercel URL on your phone's browser
- Add to Home Screen:
  - **iOS**: Tap Share → Add to Home Screen
  - **Android**: Tap Menu → Add to Home Screen
- Now it works like a native app!

## 📱 Progressive Web App (PWA) - Optional

To make it installable as a true app, we can add PWA support later. For now, the web app works great on mobile browsers!

## 🎯 Features You'll Have

✅ User authentication (sign up/login)
✅ Create and manage exercises
✅ Log workouts with sets/reps/weight
✅ View workouts grouped by week
✅ View individual workout days
✅ Secure - each user sees only their data
✅ Fast - hosted on Vercel's edge network
✅ Free - both Supabase and Vercel have generous free tiers

## 💰 Free Tier Limits

**Supabase Free Tier:**

- 500 MB database storage
- 2 GB bandwidth/month
- Unlimited API requests
- More than enough for personal gym tracking!

**Vercel Free Tier:**

- 100 GB bandwidth/month
- Unlimited deployments
- Perfect for a personal app!

## 📊 Database Structure

```
Users (Supabase Auth)
  └── Exercises (your exercise library)
  └── Workouts (grouped by date)
      └── Workout Exercises
          └── Sets (reps + weight)
```

## 🔒 Security

- Row Level Security (RLS) enabled
- Each user can only see their own data
- Automatic authentication handling
- Secure API keys (never exposed to client)

## 🛠️ What's Already Implemented

The app includes all core features:

1. ✅ Authentication UI (login/signup with email verification)
2. ✅ Exercise management page
3. ✅ Workout logging form with exercises
4. ✅ Weekly/daily workout views
5. ✅ Workout templates (save and reuse routines)
6. ✅ Exercise goals tracking (target reps/weight per exercise)
7. ✅ Multiple theme options (Blue, Red, Slate)
8. ✅ PWA support (install as mobile app)
9. ✅ Offline support via service workers

## 🛠️ Possible Future Enhancements

After deployment, you may want to add:

1. Progress charts and statistics
2. Personal records (PRs) tracking
3. Workout analytics dashboard
4. Rest timer during workouts
5. Export data to CSV
6. Exercise history and trends

Your app is fully functional and production-ready!
