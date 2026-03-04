import { supabase } from '../../lib/supabase';
import { canTransition } from '../../lib/orderStatusConfig';

export interface Order {
  id: number;
  created_at: string;
  check_in_date: string;
  order_date: string | null;
  part_eta: string | null;
  home_connect: boolean;
  wo_number: string;
  part_description: string;
  technician: string;
  store_id: string;
  cx_name: string;
  cx_phone: string;
  notes: string | null;
  cancellation_reason: string | null;
  status: 'need to order' | 'ordered' | 'received' | 'return required' | 'return authorized' | 'return complete' | 'completed' | 'cancelled';
  wo_link: string;
  part_link: string;
}

export type UserRole = 'employee' | 'manager' | 'admin';

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Checks whether a status transition is permitted for the given user role.
 * Delegates to the centralized status config in src/lib/orderStatusConfig.ts.
 * To modify transition rules, edit STATUS_CONFIG there.
 */
export function can_transition(
  order: Order,
  targetStatus: Order['status'],
  userRole: UserRole
): TransitionResult {
  return canTransition(order, targetStatus, userRole);
}

export const ordersService = {
  /**
   * Fetch orders with optional status filter and server-side pagination.
   * Returns the matching orders and the total count for the current filter.
   */
  async getOrders(
    storeId?: string,
    storeIds?: string[],
    statuses?: Order['status'][],
    page: number = 1,
    pageSize: number = 25
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      let query = supabase
        .from('order_list')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (storeIds && storeIds.length > 0) {
        query = query.in('store_id', storeIds);
      } else if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return { orders: [], total: 0 };
      }

      return { orders: data as Order[], total: count ?? 0 };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], total: 0 };
    }
  },

  /**
   * Returns distinct status values currently present in order_list for the given store(s).
   * Fetches only the status column and deduplicates in JS (PostgREST doesn't support SELECT DISTINCT).
   * RLS automatically scopes results to the user's accessible stores.
   */
  async getDistinctStatuses(storeId?: string, storeIds?: string[]): Promise<Order['status'][]> {
    try {
      let query = supabase.from('order_list').select('status');
      if (storeIds && storeIds.length > 0) {
        query = query.in('store_id', storeIds);
      } else if (storeId) {
        query = query.eq('store_id', storeId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching distinct statuses:', error);
        return [];
      }
      const seen = new Set<string>();
      const result: Order['status'][] = [];
      for (const row of data ?? []) {
        if (row.status && !seen.has(row.status)) {
          seen.add(row.status);
          result.push(row.status as Order['status']);
        }
      }
      return result;
    } catch {
      return [];
    }
  },

  /**
   * Fetch a single order by ID
   */
  async getOrderById(id: number): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('order_list')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return null;
      }

      return data as Order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  /**
   * Create a new order
   */
  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('order_list')
        .insert([order])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return null;
      }

      return data as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  },

  /**
   * Update an existing order
   * Throws an error if RLS denies the update (instead of returning null)
   */
  async updateOrder(id: number, updates: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('order_list')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check for RLS/authorization errors
        // RLS violation typically occurs when .single() can't find the row (update succeeded but select failed due to RLS)
        // OR when the policy explicitly rejects the update
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          throw new Error('Unauthorized: You do not have permission to update this order in its current status.');
        }
        if (error.code === 'PGRST100' || error.message?.includes('new row violates row-level security policy')) {
          throw new Error('Unauthorized: You do not have permission to update this order in its current status.');
        }
        // Generic error handling
        throw new Error('Failed to update order');
      }

      return data as Order;
    } catch (err) {
      // Re-throw our custom errors
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Failed to update order');
    }
  },

  /**
   * Cancel an order (for employees and managers).
   * Sets status to 'cancelled' and stores the cancellation reason.
   * Throws on failure (same pattern as updateOrder).
   */
  async cancelOrder(id: number, reason: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('order_list')
        .update({ status: 'cancelled', cancellation_reason: reason })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          throw new Error('Unauthorized: You do not have permission to cancel this order.');
        }
        throw new Error('Failed to cancel order');
      }

      return data as Order;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Failed to cancel order');
    }
  },

  /**
   * Delete an order
   */
  async deleteOrder(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('order_list')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting order:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  },
};
