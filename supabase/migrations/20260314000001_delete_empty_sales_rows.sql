-- Remove placeholder rows that have no metric data.
-- Absent rows are treated as zero throughout the app, so this is safe.
DELETE FROM public.sales WHERE metrics = '{}'::jsonb;
