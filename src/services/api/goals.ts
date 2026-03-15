import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

// goalDefinitionId → targetValue
export type StoreGoalsMap = Record<string, number>;

export const goalsService = {
  async getStoreGoals(storeId: string, month: string): Promise<StoreGoalsMap> {
    const { data, error } = await supabase
      .from('store_goals')
      .select('goal_definition_id, target_value')
      .eq('store_id', storeId)
      .eq('month', month);

    if (error) {
      logger.error('Error fetching store goals:', error);
      return {};
    }

    const map: StoreGoalsMap = {};
    for (const row of data || []) {
      map[row.goal_definition_id] = Number(row.target_value);
    }
    return map;
  },

  async saveStoreGoals(
    storeId: string,
    month: string,
    targets: StoreGoalsMap
  ): Promise<{ success: boolean }> {
    const toUpsert: { store_id: string; month: string; goal_definition_id: string; target_value: number; updated_at: string }[] = [];
    const toDelete: string[] = [];

    for (const [goalDefinitionId, value] of Object.entries(targets)) {
      if (value > 0) {
        toUpsert.push({
          store_id: storeId,
          month,
          goal_definition_id: goalDefinitionId,
          target_value: value,
          updated_at: new Date().toISOString(),
        });
      } else {
        toDelete.push(goalDefinitionId);
      }
    }

    const ops: Promise<{ error: unknown }>[] = [];

    if (toUpsert.length > 0) {
      ops.push(
        (async () => {
          const r = await supabase
            .from('store_goals')
            .upsert(toUpsert, { onConflict: 'store_id,month,goal_definition_id' });
          return { error: r.error };
        })()
      );
    }

    if (toDelete.length > 0) {
      ops.push(
        (async () => {
          const r = await supabase
            .from('store_goals')
            .delete()
            .eq('store_id', storeId)
            .eq('month', month)
            .in('goal_definition_id', toDelete);
          return { error: r.error };
        })()
      );
    }

    const results = await Promise.all(ops);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      logger.error('Error saving store goals:', failed.error);
      return { success: false };
    }

    return { success: true };
  },
};
