import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type StoreGoalsInsert = Database['public']['Tables']['store_goals']['Insert'];

export interface GoalsData {
  salesGoal: number;
  accessoryGoal: number;
  homeConnectGoal: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation function for store goals
export function validateStoreGoals(month: string, goals: GoalsData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate year (must be 2025)
  const year = parseInt(month.split('-')[0]);
  if (year !== 2025) {
    errors.push({
      field: 'month',
      message: 'Goals can only be set for the year 2025'
    });
  }
  
  // Validate monthly sales (0 to 100,000)
  if (goals.salesGoal < 0 || goals.salesGoal > 100000) {
    errors.push({
      field: 'salesGoal',
      message: 'Monthly sales must be between 0 and 100,000'
    });
  }
  
  // Validate accessory sales (0 to 5,000)
  if (goals.accessoryGoal < 0 || goals.accessoryGoal > 5000) {
    errors.push({
      field: 'accessoryGoal',
      message: 'Accessory sales must be between 0 and 5,000'
    });
  }
  
  // Validate Home Connect and Home Plus values (0 to 30)
  if (goals.homeConnectGoal < 0 || goals.homeConnectGoal > 30) {
    errors.push({
      field: 'homeConnectGoal',
      message: 'Home Connect and Home Plus values must be between 0 and 30'
    });
  }
  
  // Validate that all values are numbers
  if (!Number.isFinite(goals.salesGoal)) {
    errors.push({
      field: 'salesGoal',
      message: 'Sales goal must be a valid number'
    });
  }
  
  if (!Number.isFinite(goals.accessoryGoal)) {
    errors.push({
      field: 'accessoryGoal',
      message: 'Accessory goal must be a valid number'
    });
  }
  
  if (!Number.isFinite(goals.homeConnectGoal)) {
    errors.push({
      field: 'homeConnectGoal',
      message: 'Home Connect goal must be a valid number'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface SaveGoalsResult {
  success: boolean;
  validation?: ValidationResult;
}

export const goalsService = {
  async getStoreGoals(storeId: string, month: string): Promise<GoalsData | null> {
    const { data, error } = await supabase
      .from('store_goals')
      .select('*')
      .eq('store_id', storeId)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      console.error('Error fetching store goals:', error);
      return null;
    }

    // If no goal exists for this store/month, return null
    if (!data) {
      return null;
    }

    return {
      salesGoal: data.sales_goal,
      accessoryGoal: data.accessory_goal,
      homeConnectGoal: data.home_connect_goal,
    };
  },

  async saveStoreGoals(storeId: string, month: string, goals: GoalsData): Promise<SaveGoalsResult> {
    // Validate the goals first
    const validation = validateStoreGoals(month, goals);
    
    if (!validation.isValid) {
      return {
        success: false,
        validation
      };
    }

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
      return {
        success: false
      };
    }

    return {
      success: true
    };
  }
};
