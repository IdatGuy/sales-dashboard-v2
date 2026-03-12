alter table sales_metric_definitions
  add column is_deprecated boolean not null default false;
