-- Shared editable ERP implementation roadmap.
-- Run in the Product Hub Supabase SQL Editor before deploying this version.

create table if not exists public.roadmap_documents (
  id text primary key,
  payload jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists roadmap_documents_set_updated_at on public.roadmap_documents;
create trigger roadmap_documents_set_updated_at
before update on public.roadmap_documents
for each row execute function public.set_updated_at();

alter table public.roadmap_documents enable row level security;

create policy "Hub users can read roadmap"
on public.roadmap_documents for select to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid()));

create policy "Admins manage roadmap"
on public.roadmap_documents for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));
