-- Add 'percentage' as a valid unit_type for sales_metric_definitions
alter table public.sales_metric_definitions
  drop constraint sales_metric_definitions_unit_type_check;

alter table public.sales_metric_definitions
  add constraint sales_metric_definitions_unit_type_check
  check (unit_type in ('currency', 'count', 'percentage'));
