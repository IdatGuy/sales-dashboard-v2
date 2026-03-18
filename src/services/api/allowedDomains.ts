import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { AllowedDomain } from '../../types';

export function normalizeDomain(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
}

function transform(row: Record<string, unknown>): AllowedDomain {
  return {
    id: row.id as string,
    domain: row.domain as string,
    label: row.label as string,
    createdAt: row.created_at as string,
  };
}

export const allowedDomainsService = {
  async getAllowedDomains(): Promise<AllowedDomain[]> {
    const { data, error } = await supabase
      .from('allowed_part_link_domains')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      logger.error('Error fetching allowed domains:', error);
      return [];
    }
    return (data || []).map(transform);
  },

  async addAllowedDomain(
    domain: string,
    label: string
  ): Promise<{ success: boolean; domain?: AllowedDomain; error?: string }> {
    let normalized: string;
    try {
      normalized = normalizeDomain(domain);
    } catch {
      return { success: false, error: 'Invalid domain format.' };
    }

    const { data, error } = await supabase
      .from('allowed_part_link_domains')
      .insert({ domain: normalized, label: label.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `"${normalized}" is already in the allowlist.` };
      }
      logger.error('Error adding allowed domain:', error);
      return { success: false, error: 'Failed to add domain. Please try again.' };
    }
    return { success: true, domain: transform(data as Record<string, unknown>) };
  },

  async deleteAllowedDomain(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('allowed_part_link_domains')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting allowed domain:', error);
      return { success: false, error: 'Failed to remove domain. Please try again.' };
    }
    return { success: true };
  },
};
