-- Add total_sales as a builtin metric (sort_order=0 so it appears first)
INSERT INTO public.sales_metric_definitions (key, label, unit_type, is_visible, sort_order, is_builtin)
VALUES ('total_sales', 'Total Sales', 'currency', true, 0, true);

-- Create goal_definitions table
CREATE TABLE public.goal_definitions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  metric_keys   text[] not null,
  unit_type     text not null check (unit_type in ('currency', 'count', 'percentage')),
  sort_order    integer not null default 0,
  is_deprecated boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Drop old store_goals table (data intentionally discarded) and recreate
DROP TABLE public.store_goals CASCADE;

CREATE TABLE public.store_goals (
  store_id           uuid not null references public.stores(id) on delete cascade,
  month              text not null check (month ~ '^\d{4}-\d{2}$'),
  goal_definition_id uuid not null references public.goal_definitions(id) on delete cascade,
  target_value       numeric not null default 0,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  primary key (store_id, month, goal_definition_id)
);

-- RLS: goal_definitions
ALTER TABLE public.goal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read goal definitions"
  ON public.goal_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage goal definitions"
  ON public.goal_definitions FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- RLS: new store_goals
ALTER TABLE public.store_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals for their stores"
  ON public.store_goals FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_store_access
      WHERE user_id = (SELECT auth.uid()) AND store_id = store_goals.store_id
    )
  );

CREATE POLICY "Managers and admins can manage store goals"
  ON public.store_goals FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
    AND (
      (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_store_access
        WHERE user_id = (SELECT auth.uid()) AND store_id = store_goals.store_id
      )
    )
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
    AND (
      (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_store_access
        WHERE user_id = (SELECT auth.uid()) AND store_id = store_goals.store_id
      )
    )
  );
