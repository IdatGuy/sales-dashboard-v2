// services/api/commission.ts
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Commission } from '../../types';

type DbCommission = Database['public']['Tables']['commissions']['Row'];

function transformDbCommissionToCommission(dbCommission: DbCommission): Commission {
  const accessorySales = dbCommission.accessory_sales ?? 0;
  const homeConnects = dbCommission.home_connects ?? 0;
  const residuals = dbCommission.residuals ?? 0;

  return {
    id: dbCommission.id,
    userId: dbCommission.user_id ?? '',
    month: dbCommission.month,
    total: accessorySales + homeConnects + residuals,
    breakdown: {
      accessorySales,
      homeConnects,
      residuals,
    },
  };
}

export async function getUserCommission(userId: string, month: string): Promise<Commission | null> {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (error) {
      console.error('Error fetching user commission:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return transformDbCommissionToCommission(data);
  } catch (error) {
    console.error('Error fetching user commission:', error);
    return null;
  }
}

export async function getUserCommissions(userId: string, year?: string): Promise<Commission[]> {
  try {
    let query = supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false });

    if (year) {
      // Filter by year if provided
      query = query.gte('month', `${year}-01`).lte('month', `${year}-12`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user commissions:', error);
      return [];
    }

    return (data || []).map(transformDbCommissionToCommission);
  } catch (error) {
    console.error('Error fetching user commissions:', error);
    return [];
  }
}

export async function createOrUpdateCommission(commission: Omit<Commission, 'id'>): Promise<Commission | null> {
  try {
    const dbCommission = {
      user_id: commission.userId,
      month: commission.month,
      accessory_sales: commission.breakdown.accessorySales,
      home_connects: commission.breakdown.homeConnects,
      residuals: commission.breakdown.residuals,
    };

    const { data, error } = await supabase
      .from('commissions')
      .upsert(dbCommission, {
        onConflict: 'user_id,month',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating commission:', error);
      return null;
    }

    return transformDbCommissionToCommission(data);
  } catch (error) {
    console.error('Error creating/updating commission:', error);
    return null;
  }
}

export const commissionService = {
  getUserCommission,
  getUserCommissions,
  createOrUpdateCommission,
};
