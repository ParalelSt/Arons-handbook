-- Supabase Database Schema for Gym LogBook
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Exercises table
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now() not null,
  
  constraint exercises_name_check check (char_length(name) > 0)
);

-- Workouts table
create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  title text,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Workout exercises (join table between workouts and exercises)
create table public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  notes text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now() not null
);

-- Sets table
create table public.sets (
  id uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  reps integer not null check (reps > 0),
  weight numeric(10, 2) not null check (weight >= 0),
  order_index integer not null default 0,
  created_at timestamp with time zone default now() not null
);

-- Indexes for better query performance
create index exercises_user_id_idx on public.exercises(user_id);
create index workouts_user_id_idx on public.workouts(user_id);
create index workouts_date_idx on public.workouts(date);
create index workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);
create index sets_workout_exercise_id_idx on public.sets(workout_exercise_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;

-- Exercises policies
create policy "Users can view their own exercises"
  on public.exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Workouts policies
create policy "Users can view their own workouts"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workouts"
  on public.workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workouts"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- Workout exercises policies
create policy "Users can view their own workout exercises"
  on public.workout_exercises for select
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can insert their own workout exercises"
  on public.workout_exercises for insert
  with check (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can update their own workout exercises"
  on public.workout_exercises for update
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can delete their own workout exercises"
  on public.workout_exercises for delete
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- Sets policies
create policy "Users can view their own sets"
  on public.sets for select
  using (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can insert their own sets"
  on public.sets for insert
  with check (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can update their own sets"
  on public.sets for update
  using (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can delete their own sets"
  on public.sets for delete
  using (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
      and workouts.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger set_updated_at
  before update on public.workouts
  for each row
  execute function public.handle_updated_at();
