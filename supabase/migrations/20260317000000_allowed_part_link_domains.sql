CREATE TABLE public.allowed_part_link_domains (
  id         uuid primary key default gen_random_uuid(),
  domain     text not null unique,
  label      text not null,
  created_at timestamptz default now()
);

ALTER TABLE public.allowed_part_link_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read allowed domains"
  ON public.allowed_part_link_domains FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage allowed domains"
  ON public.allowed_part_link_domains FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin');
