-- Add workout templates table
create table public.workout_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  
  constraint template_name_check check (char_length(name) > 0)
);

-- Template exercises (what exercises are in each template)
create table public.template_exercises (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references public.workout_templates(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  target_sets integer not null default 3,
  target_reps integer,
  target_weight numeric(10, 2),
  notes text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now() not null
);

-- Indexes
create index workout_templates_user_id_idx on public.workout_templates(user_id);
create index template_exercises_template_id_idx on public.template_exercises(template_id);

-- RLS Policies for workout_templates
alter table public.workout_templates enable row level security;

create policy "Users can view their own templates"
  on public.workout_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on public.workout_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.workout_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.workout_templates for delete
  using (auth.uid() = user_id);

-- RLS Policies for template_exercises
alter table public.template_exercises enable row level security;

create policy "Users can view their own template exercises"
  on public.template_exercises for select
  using (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = template_exercises.template_id
      and workout_templates.user_id = auth.uid()
    )
  );

create policy "Users can insert their own template exercises"
  on public.template_exercises for insert
  with check (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = template_exercises.template_id
      and workout_templates.user_id = auth.uid()
    )
  );

create policy "Users can update their own template exercises"
  on public.template_exercises for update
  using (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = template_exercises.template_id
      and workout_templates.user_id = auth.uid()
    )
  );

create policy "Users can delete their own template exercises"
  on public.template_exercises for delete
  using (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = template_exercises.template_id
      and workout_templates.user_id = auth.uid()
    )
  );

-- Trigger for template updated_at
create trigger set_template_updated_at
  before update on public.workout_templates
  for each row
  execute function public.handle_updated_at();
