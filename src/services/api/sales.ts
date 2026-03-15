// services/SalesService.ts
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/database.types'
import { Sale as UISale } from '../../types';

type Sale = Database['public']['Tables']['sales']['Row']

// Utility to get last day of a month as YYYY-MM-DD
function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0);
  return lastDay.toISOString().split('T')[0];
}

function transformDbSaleToSale(dbSale: Sale): UISale {
  return {
    id: `${dbSale.store_id}-${dbSale.date}`,
    storeId: dbSale.store_id,
    date: dbSale.date,
    metrics: (dbSale.metrics as Record<string, number>) ?? {},
  };
}

export interface DailySalesInput {
  metrics: Record<string, number>;
}

export async function upsertDailySales(
  storeId: string,
  date: string,
  data: DailySalesInput,
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('sales')
    .upsert(
      {
        store_id: storeId,
        date,
        metrics: data.metrics,
        created_by: createdBy,
      },
      { onConflict: 'store_id,date' }
    );

  if (error) {
    console.error('Error upserting sales:', error);
    return { success: false, error: 'Failed to save sales data. Please try again.' };
  }
  return { success: true };
}

export async function getStoreDailySales(storeId: string, month: string): Promise<UISale[]> {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error(`Invalid month format: ${month}`);
    return [];
  }
  const [year, monthNum] = month.split('-').map(Number);
  const start = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
  const end = getLastDayOfMonth(year, monthNum);
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', start)
    .lte('date', end);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map(transformDbSaleToSale);
}

export async function getStoreMonthlySales(storeId: string, year: string): Promise<UISale[]> {
  if (!/^\d{4}$/.test(year)) {
    console.error(`Invalid year format: ${year}`);
    return [];
  }
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', start)
    .lte('date', end);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map(transformDbSaleToSale);
}

export interface CsvSalesRow {
  store_id: string;
  date: string;
  [metricKey: string]: string | number;
}

export async function bulkUpsertSalesFromCsv(
  rows: Array<{ store_id: string; date: string; metrics: Record<string, number> }>,
  createdBy: string
): Promise<{ inserted: number; errors: string[] }> {
  const records = rows.map((row) => ({
    store_id: row.store_id,
    date: row.date,
    created_by: createdBy,
    metrics: row.metrics,
  }));

  const CHUNK_SIZE = 50;
  const errors: string[] = [];
  let inserted = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const { error, data } = await supabase
      .from('sales')
      .upsert(chunk, { onConflict: 'store_id,date' })
      .select();
    if (error) {
      errors.push(`Rows ${i + 1}–${i + chunk.length}: ${error.message}`);
    } else {
      inserted += data?.length ?? chunk.length;
    }
  }

  return { inserted, errors };
}
