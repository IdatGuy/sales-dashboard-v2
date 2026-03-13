import { Sale } from '../types';
import { MetricDefinition } from '../services/api/metricDefinitions';

export const BUILTIN_KEY_TO_SALE_PROP: Record<string, keyof Sale> = {
  total_sales: 'salesAmount',
  accessory_sales: 'accessorySales',
  home_connects: 'homeConnects',
  home_plus: 'homePlus',
  cleanings: 'cleanings',
  repairs: 'repairs',
};

export function getSaleValueForMetric(sale: Sale, metric: MetricDefinition): number {
  if (metric.isBuiltin) {
    const prop = BUILTIN_KEY_TO_SALE_PROP[metric.key];
    return prop ? ((sale[prop] as number) ?? 0) : 0;
  }
  return sale.customMetrics[metric.key] ?? 0;
}
