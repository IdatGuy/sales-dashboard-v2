-- Create sales_metric_definitions table
create table public.sales_metric_definitions (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  label      text not null,
  unit_type  text not null check (unit_type in ('currency', 'count')),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  is_builtin boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed built-in metrics (matching existing sales table columns)
insert into public.sales_metric_definitions (key, label, unit_type, is_visible, sort_order, is_builtin)
values
  ('accessory_sales', 'Accessory Sales', 'currency', true, 10, true),
  ('home_connects',   'Home Connects',   'count',    true, 20, true),
  ('home_plus',       'Home Plus',       'count',    true, 30, true),
  ('cleanings',       'Cleanings',       'count',    true, 40, true),
  ('repairs',         'Repairs',         'count',    true, 50, true);

-- Add custom_metrics column to sales table for future non-builtin metrics
alter table public.sales
  add column custom_metrics jsonb default '{}';

-- RLS: all authenticated users can read metric definitions (needed to render dashboard)
create policy "Authenticated users can read metric definitions"
  on public.sales_metric_definitions
  for select
  to authenticated
  using (true);

-- RLS: only admins can create/update/delete definitions
create policy "Admins can manage metric definitions"
  on public.sales_metric_definitions
  for all
  to authenticated
  using (
    (select role from profiles where id = (select auth.uid())) = 'admin'
  )
  with check (
    (select role from profiles where id = (select auth.uid())) = 'admin'
  );

alter table public.sales_metric_definitions enable row level security;
