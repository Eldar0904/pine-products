-- Adds the fields required for editable roadmap cards.
-- Run this migration in Supabase SQL Editor for an existing Product Hub database.

alter table public.solutions
  add column if not exists roadmap_stage text not null default 'Discovery',
  add column if not exists next_step text not null default '',
  add column if not exists target_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'solutions_roadmap_stage_check'
  ) then
    alter table public.solutions
      add constraint solutions_roadmap_stage_check
      check (roadmap_stage in ('Discovery', 'Building', 'Testing', 'Live', 'Measuring outcome'));
  end if;
end $$;
