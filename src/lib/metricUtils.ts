import { Sale } from '../types';
import { MetricDefinition } from '../services/api/metricDefinitions';

export function getSaleValueForMetric(sale: Sale, metric: MetricDefinition): number {
  return sale.metrics[metric.key] ?? 0;
}
