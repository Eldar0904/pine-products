-- Run in the Product Hub database once its project is selected.
-- Private feedback: submitted through the server, reviewed in Supabase Table Editor.
create table if not exists public.employee_feedback (
  id uuid primary key,
  solution_id text not null check (solution_id in ('goszakup', 'offers', 'agreements', 'edumax', 'documents')),
  employee_name text check (char_length(employee_name) <= 80),
  department text not null check (department in ('B2B', 'Коммерция', 'Оперблок', 'Заң бөлімі', 'Білім беру', 'Басқа')),
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);
alter table public.employee_feedback enable row level security;
revoke all on public.employee_feedback from anon, authenticated;
grant select, insert on public.employee_feedback to service_role;
