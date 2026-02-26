import { supabase } from '../../lib/supabase';
import { ManagedUser, Store } from '../../types';

export interface UsersListResult {
  users: ManagedUser[];
  availableStores: Pick<Store, 'id' | 'name' | 'location'>[];
}

async function invoke(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('manage-users', {
    body: { action, ...params },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export const usersService = {
  async listUsers(): Promise<UsersListResult> {
    return invoke('list') as Promise<UsersListResult>;
  },

  async updateUser(
    userId: string,
    updates: { name?: string; role?: string; storeIds?: string[] }
  ): Promise<void> {
    await invoke('update', { userId, ...updates });
  },

  async deactivateUser(userId: string): Promise<void> {
    await invoke('deactivate', { userId });
  },

  async reactivateUser(userId: string): Promise<void> {
    await invoke('reactivate', { userId });
  },
};
