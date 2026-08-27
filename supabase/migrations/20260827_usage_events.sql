-- Durable usage events emitted by PINE instrument pages.
-- The Product Hub server writes with the Supabase service-role key; browser clients
-- only receive aggregated counts through /api/usage.

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  solution_id text not null,
  event_name text not null default 'output.generated',
  quantity integer not null default 1 check (quantity > 0 and quantity <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  source text not null default 'instrument',
  idempotency_key text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists usage_events_idempotency_key_idx
  on public.usage_events(idempotency_key)
  where idempotency_key is not null;
create index if not exists usage_events_solution_occurred_idx
  on public.usage_events(solution_id, occurred_at);

alter table public.usage_events enable row level security;
