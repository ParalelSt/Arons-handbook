-- Seed or update exercise goals for the current signed-in user.
-- Edit the exercise names/targets below to match your exercises.

with desired_goals(name, target_reps, target_weight) as (
  values
    ('Bench Press', 8, 80),
    ('Squat', 8, 100),
    ('Deadlift', 5, 120),
    ('Overhead Press', 6, 50),
    ('Pull Up', 10, null)
), resolved as (
  select e.id as exercise_id, dg.target_reps, dg.target_weight
  from desired_goals dg
  join exercises e
    on e.name = dg.name
   and e.user_id = auth.uid()
)
insert into exercise_goals (user_id, exercise_id, target_reps, target_weight)
select auth.uid(), exercise_id, target_reps, target_weight
from resolved
on conflict (user_id, exercise_id)
do update
  set target_reps = excluded.target_reps,
      target_weight = excluded.target_weight;
