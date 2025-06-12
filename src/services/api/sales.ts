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
    salesAmount: dbSale.sales_amount ?? 0,
    accessorySales: dbSale.accessory_sales ?? 0,
    
    homeConnects: dbSale.home_connects ?? 0,
    homePlus: dbSale.home_plus ?? 0,
    cleanings: dbSale.cleanings ?? 0,
    repairs: dbSale.repairs ?? 0,
  };
}

export async function getStoreDailySales(storeId: string, month: string): Promise<UISale[]> {
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
