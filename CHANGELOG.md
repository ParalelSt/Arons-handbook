# Changelog

All notable changes to the Gym LogBook project will be documented in this file.

## v2.0.0 — 2026-02-14

### Added

- **Exercise progress comparison** — each exercise card shows previous performance with trend indicators (↑/↓/→)
- **Week template system with weight carry-over** — templates auto-fill last used weights for each exercise, falling back to template defaults
- **Analytics foundation** — reusable service-layer utilities: `getExerciseHistory()`, `getMaxWeightOverTime()`, `getVolumeOverTime()`, `getWeeklyVolumes()`, `detectPR()`, `getWeekComparison()`
- **PR tracking** — automatic personal record detection and storage in `personal_records` table with "PR" badge in workout view
- **Analytics page** (`/analytics`) — strength progress line chart, volume trend bar chart, weekly comparison, PR timeline
- **Optional AdSense integration** — `AdBanner` component renders only when `VITE_ENABLE_ADS=true` AND in production mode; env-controlled publisher/slot IDs
- **Supabase performance optimisation** — additional indexes on `sets.created_at`, `workouts(user_id, date)`, `workout_exercises.created_at`, `personal_records(user_id, exercise_name, date)`, `exercise_goals(user_id, exercise_id)`
- **RLS enforcement** — Row Level Security enabled and policies created for `exercise_goals` and `personal_records` tables
- **Function security** — `handle_updated_at()` and `set_updated_at()` functions updated with `SECURITY DEFINER` and explicit `SET search_path = public`
- **Security and payment handling safeguards** — documented policy: never handle raw payment data, no secrets in frontend, env-only configuration

### Changed

- Templates now use `getLastUsedWeight()` for intelligent weight carry-over when creating workouts
- Home screen navigation updated with Analytics button
- README expanded with architecture documentation, security policy, and monetization model

### Migration

Run `supabase/migrations/20260214_analytics_prs_security.sql` in your Supabase SQL Editor.
