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

export const commissionService = {
  getUserCommission,
};
