-- Creates exercise_goals table for per-exercise targets
-- Safe to rerun; creates table only if missing.

create table if not exists exercise_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete cascade,
  target_reps integer,
  target_weight numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_goals_user_exercise_uniq unique (user_id, exercise_id)
);

-- Keep updated_at in sync
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_exercise_goals_updated_at on exercise_goals;
create trigger trg_exercise_goals_updated_at
before update on exercise_goals
for each row
execute procedure set_updated_at();
