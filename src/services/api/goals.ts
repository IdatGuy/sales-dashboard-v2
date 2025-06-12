import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type StoreGoalsInsert = Database['public']['Tables']['store_goals']['Insert'];

export interface GoalsData {
  salesGoal: number;
  accessoryGoal: number;
  homeConnectGoal: number;
}

export const goalsService = {
  async getStoreGoals(storeId: string, month: string): Promise<GoalsData | null> {
    const { data, error } = await supabase
      .from('store_goals')
      .select('*')
      .eq('store_id', storeId)
      .eq('month', month)
      .single();

    if (error) {
      console.error('Error fetching store goals:', error);
      return null;
    }

    return {
      salesGoal: data.sales_goal,
      accessoryGoal: data.accessory_goal,
      homeConnectGoal: data.home_connect_goal,
    };
  },

  async saveStoreGoals(storeId: string, month: string, goals: GoalsData): Promise<boolean> {
    const goalsData: StoreGoalsInsert = {
      store_id: storeId,
      month,
      sales_goal: goals.salesGoal,
      accessory_goal: goals.accessoryGoal,
      home_connect_goal: goals.homeConnectGoal,
    };

    const { error } = await supabase
      .from('store_goals')
      .upsert(goalsData, {
        onConflict: 'store_id,month'
      });

    if (error) {
      console.error('Error saving store goals:', error);
      return false;
    }

    return true;
  }
};
