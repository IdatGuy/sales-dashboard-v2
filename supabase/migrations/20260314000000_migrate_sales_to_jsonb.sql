-- Rename custom_metrics → metrics
ALTER TABLE public.sales RENAME COLUMN custom_metrics TO metrics;

-- Backfill any NULLs before adding NOT NULL constraint
UPDATE public.sales SET metrics = '{}' WHERE metrics IS NULL;

ALTER TABLE public.sales
  ALTER COLUMN metrics SET NOT NULL,
  ALTER COLUMN metrics SET DEFAULT '{}';

-- Migrate dedicated column values into the metrics JSONB field.
-- jsonb_strip_nulls prevents NULL column values from writing null-valued keys.
UPDATE public.sales
SET metrics = metrics || jsonb_strip_nulls(jsonb_build_object(
  'gross_revenue',   sales_amount,
  'accessory_sales', accessory_sales,
  'home_connects',   home_connects,
  'home_plus',       home_plus,
  'cleanings',       cleanings,
  'repairs',         repairs
))
WHERE sales_amount    IS NOT NULL
   OR accessory_sales IS NOT NULL
   OR home_connects   IS NOT NULL
   OR home_plus       IS NOT NULL
   OR cleanings       IS NOT NULL
   OR repairs         IS NOT NULL;

-- Drop the dedicated numeric columns
ALTER TABLE public.sales
  DROP COLUMN sales_amount,
  DROP COLUMN accessory_sales,
  DROP COLUMN home_connects,
  DROP COLUMN home_plus,
  DROP COLUMN cleanings,
  DROP COLUMN repairs;

-- Rename metric definition key: total_sales → gross_revenue
UPDATE public.sales_metric_definitions
  SET key = 'gross_revenue', label = 'Gross Revenue'
  WHERE key = 'total_sales';

-- GIN index for fast JSONB key lookups
CREATE INDEX IF NOT EXISTS idx_sales_metrics ON public.sales USING GIN (metrics);
