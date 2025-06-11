import { supabase } from '../../lib/supabase';
import { Tables } from '../../lib/database.types';

export async function getStoresByIds(storeIds: string[]): Promise<Tables<'stores'>[]> {
  if (!storeIds.length) return [];
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, location')
    .in('id', storeIds);
  if (error) throw new Error(error.message || 'Failed to fetch stores');
  return (data || []) as Tables<'stores'>[];
}
