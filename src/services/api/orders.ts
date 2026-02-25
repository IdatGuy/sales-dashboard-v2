import { supabase } from '../../lib/supabase';

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
  status: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed' | 'cancelled';
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
 * Encodes the state machine from Parts Ordering Access Control.csv.
 */
export function can_transition(
  order: Order,
  targetStatus: Order['status'],
  userRole: UserRole
): TransitionResult {
  // Admin god mode
  if (userRole === 'admin') return { allowed: true };

  const { status: from, created_at } = order;

  if (from === 'need to order') {
    if (targetStatus === 'ordered') {
      return userRole === 'manager'
        ? { allowed: true }
        : { allowed: false, reason: 'Only managers can approve orders.' };
    }
    if (targetStatus === 'cancelled') {
      if (userRole === 'manager') return { allowed: true };
      // Employee: 1-hour cancellation window
      const elapsed = Date.now() - new Date(created_at).getTime();
      return elapsed <= 60 * 60 * 1000
        ? { allowed: true }
        : { allowed: false, reason: 'Cancellation window (1 hour) has expired.' };
    }
    if (targetStatus === 'out of stock') {
      return userRole === 'manager'
        ? { allowed: true }
        : { allowed: false, reason: 'Only managers can mark orders as out of stock.' };
    }
  }

  if (from === 'ordered' && targetStatus === 'received') return { allowed: true };
  if (from === 'received' && targetStatus === 'completed') return { allowed: true };

  return { allowed: false, reason: `Transition from "${from}" to "${targetStatus}" is not permitted.` };
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
        throw new Error(`Failed to update order: ${error.message || 'Unknown error'}`);
      }

      return data as Order;
    } catch (err) {
      // Re-throw our custom errors
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Failed to update order: ${String(err)}`);
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
        throw new Error(`Failed to cancel order: ${error.message || 'Unknown error'}`);
      }

      return data as Order;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Failed to cancel order: ${String(err)}`);
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
