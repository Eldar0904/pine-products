-- PINE Product Hub: initial shared database schema
-- Run this whole file in Supabase Dashboard > SQL Editor > New query.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'executive');
create type public.solution_stage as enum ('building', 'testing', 'live', 'paused');
create type public.solution_health as enum ('healthy', 'attention', 'at_risk');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.solutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references public.departments(id) on delete set null,
  stage public.solution_stage not null default 'building',
  health public.solution_health not null default 'attention',
  validated_value text not null default 'Baseline',
  current_status text not null default '',
  accent text not null default 'teal' check (accent in ('teal', 'blue', 'amber', 'violet')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index solutions_department_id_idx on public.solutions(department_id);
create index solutions_stage_idx on public.solutions(stage);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger solutions_set_updated_at before update on public.solutions
for each row execute function public.set_updated_at();

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.solutions enable row level security;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Admins manage profiles"
on public.profiles for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "Users can view their own role"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "Hub users can read departments"
on public.departments for select to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid()));

create policy "Admins manage departments"
on public.departments for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "Hub users can read solutions"
on public.solutions for select to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid()));

create policy "Admins manage solutions"
on public.solutions for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

insert into public.departments (name) values
  ('Procurement'), ('Legal'), ('Academic'), ('B2B'), ('PR'), ('Finance'), ('Distribution'), ('Warehouse')
on conflict (name) do nothing;

-- After creating your first Supabase Auth user, run this separately with its UUID:
-- insert into public.user_roles (user_id, role) values ('YOUR_AUTH_USER_UUID', 'admin');
