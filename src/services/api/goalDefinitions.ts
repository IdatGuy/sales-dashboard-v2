import { supabase } from '../../lib/supabase';

export interface GoalDefinition {
  id: string;
  name: string;
  metricKeys: string[];
  unitType: 'currency' | 'count' | 'percentage';
  sortOrder: number;
  isDeprecated: boolean;
}

function transform(row: Record<string, unknown>): GoalDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    metricKeys: row.metric_keys as string[],
    unitType: row.unit_type as 'currency' | 'count' | 'percentage',
    sortOrder: row.sort_order as number,
    isDeprecated: (row.is_deprecated as boolean) ?? false,
  };
}

export async function listGoalDefinitions(): Promise<GoalDefinition[]> {
  const { data, error } = await supabase
    .from('goal_definitions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching goal definitions:', error);
    return [];
  }
  return (data || []).map(transform);
}

export async function createGoalDefinition(
  name: string,
  metricKeys: string[],
  unitType: 'currency' | 'count' | 'percentage'
): Promise<{ success: boolean; definition?: GoalDefinition; error?: string }> {
  const { data: existing } = await supabase
    .from('goal_definitions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxOrder = (existing?.[0]?.sort_order as number) ?? 0;

  const { data, error } = await supabase
    .from('goal_definitions')
    .insert({
      name,
      metric_keys: metricKeys,
      unit_type: unitType,
      sort_order: maxOrder + 10,
      is_deprecated: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal definition:', error);
    return { success: false, error: 'Failed to create goal. Please try again.' };
  }
  return { success: true, definition: transform(data as Record<string, unknown>) };
}

export async function updateGoalDefinition(
  id: string,
  updates: { name?: string; sortOrder?: number; isDeprecated?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  if (updates.isDeprecated !== undefined) dbUpdates.is_deprecated = updates.isDeprecated;

  const { error } = await supabase
    .from('goal_definitions')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating goal definition:', error);
    return { success: false, error: 'Failed to update goal. Please try again.' };
  }
  return { success: true };
}

export async function deleteGoalDefinition(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('goal_definitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting goal definition:', error);
    return { success: false, error: 'Failed to delete goal. Please try again.' };
  }
  return { success: true };
}

export async function reorderGoalDefinitions(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('goal_definitions')
      .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error('Error reordering goal definitions:', failed.error);
    return { success: false, error: 'Failed to reorder goals. Please try again.' };
  }
  return { success: true };
}
