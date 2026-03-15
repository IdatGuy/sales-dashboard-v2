import { supabase } from '../../lib/supabase';
import { Tables } from '../../lib/database.types';

export const storesService = {
  async getStoresByIds(storeIds: string[]): Promise<Tables<'stores'>[]> {
    if (!storeIds.length) return [];
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, location')
      .in('id', storeIds);
    if (error) throw new Error('Failed to fetch stores');
    return (data || []) as Tables<'stores'>[];
  },

  async getAllStores(): Promise<Tables<'stores'>[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, location');
    if (error) throw new Error('Failed to fetch stores');
    return (data || []) as Tables<'stores'>[];
  },
};

export const { getStoresByIds, getAllStores } = storesService;
