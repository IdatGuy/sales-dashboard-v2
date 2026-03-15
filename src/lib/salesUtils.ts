import { Sale } from '../types';
import { MetricDefinition } from '../services/api/metricDefinitions';

export function getSaleValueForMetric(sale: Sale, metric: MetricDefinition): number {
  return sale.metrics[metric.key] ?? 0;
}

/**
 * Aggregates an array of daily Sale records into monthly totals.
 * When `metrics` is provided, each metric key is summed; otherwise only gross_revenue is aggregated.
 */
export function aggregateDailySalesToMonthly(sales: Sale[], metrics?: MetricDefinition[]): Sale[] {
  const monthlyMap: { [key: string]: Sale } = {};
  sales.forEach((sale) => {
    const monthKey = sale.date.substring(0, 7);
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        id: `${sale.storeId}-${monthKey}`,
        storeId: sale.storeId,
        date: `${monthKey}-01`,
        metrics: metrics ? {} : { gross_revenue: 0 },
      };
    }
    if (metrics) {
      metrics.forEach((metric) => {
        const val = getSaleValueForMetric(sale, metric);
        monthlyMap[monthKey].metrics[metric.key] =
          (monthlyMap[monthKey].metrics[metric.key] ?? 0) + val;
      });
    } else {
      monthlyMap[monthKey].metrics['gross_revenue'] =
        (monthlyMap[monthKey].metrics['gross_revenue'] ?? 0) + (sale.metrics['gross_revenue'] ?? 0);
    }
  });
  return Object.values(monthlyMap).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Returns a new Sale[] where the given metricKey is replaced with a running cumulative sum.
 */
export function accumulateSales(sales: Sale[], metricKey: string = 'gross_revenue'): Sale[] {
  let runningTotal = 0;
  return sales.map((sale) => {
    runningTotal += sale.metrics[metricKey] ?? 0;
    return { ...sale, metrics: { ...sale.metrics, [metricKey]: runningTotal } };
  });
}
