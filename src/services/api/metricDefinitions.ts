import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export interface MetricDefinition {
  id: string;
  key: string;
  label: string;
  unitType: 'currency' | 'count' | 'percentage';
  isVisible: boolean;
  sortOrder: number;
  isBuiltin: boolean;
  isDeprecated: boolean;
}

function transform(row: Record<string, unknown>): MetricDefinition {
  return {
    id: row.id as string,
    key: row.key as string,
    label: row.label as string,
    unitType: row.unit_type as 'currency' | 'count',
    isVisible: row.is_visible as boolean,
    sortOrder: row.sort_order as number,
    isBuiltin: row.is_builtin as boolean,
    isDeprecated: (row.is_deprecated as boolean) ?? false,
  };
}

export const metricDefinitionsService = {
  async getMetricDefinitions(): Promise<MetricDefinition[]> {
    const { data, error } = await supabase
      .from('sales_metric_definitions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('Error fetching metric definitions:', error);
      return [];
    }
    return (data || []).map(transform);
  },

  async createMetricDefinition(
    label: string,
    unitType: 'currency' | 'count' | 'percentage'
  ): Promise<{ success: boolean; definition?: MetricDefinition; error?: string }> {
    const { data: existing } = await supabase
      .from('sales_metric_definitions')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxOrder = (existing?.[0]?.sort_order as number) ?? 0;
    const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;

    const { data, error } = await supabase
      .from('sales_metric_definitions')
      .insert({
        key,
        label,
        unit_type: unitType,
        is_visible: true,
        sort_order: maxOrder + 10,
        is_builtin: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating metric definition:', error);
      return { success: false, error: 'Failed to create metric. Please try again.' };
    }
    return { success: true, definition: transform(data as Record<string, unknown>) };
  },

  async updateMetricDefinition(
    id: string,
    updates: { label?: string; isVisible?: boolean; sortOrder?: number; isDeprecated?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.isVisible !== undefined) dbUpdates.is_visible = updates.isVisible;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.isDeprecated !== undefined) dbUpdates.is_deprecated = updates.isDeprecated;

    const { error } = await supabase
      .from('sales_metric_definitions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      logger.error('Error updating metric definition:', error);
      return { success: false, error: 'Failed to update metric. Please try again.' };
    }
    return { success: true };
  },

  async reorderMetricDefinitions(
    orderedIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('sales_metric_definitions')
        .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      logger.error('Error reordering metric definitions:', failed.error);
      return { success: false, error: 'Failed to reorder metrics. Please try again.' };
    }
    return { success: true };
  },

  async deleteMetricDefinition(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('sales_metric_definitions')
      .delete()
      .eq('id', id)
      .eq('is_builtin', false);

    if (error) {
      logger.error('Error deleting metric definition:', error);
      return { success: false, error: 'Failed to delete metric. Please try again.' };
    }
    return { success: true };
  },
};

export const {
  getMetricDefinitions,
  createMetricDefinition,
  updateMetricDefinition,
  reorderMetricDefinitions,
  deleteMetricDefinition,
} = metricDefinitionsService;
