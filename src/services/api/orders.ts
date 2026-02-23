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
  status: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed';
  wo_link: string;
  part_link: string;
}

export const ordersService = {
  /**
   * Fetch all orders or orders for a specific store, or multiple stores
   */
  async getOrders(storeId?: string, storeIds?: string[]): Promise<Order[]> {
    try {
      let query = supabase
        .from('order_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeIds && storeIds.length > 0) {
        query = query.in('store_id', storeIds);
      } else if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return data as Order[];
    } catch (error) {
      console.error('Error fetching orders:', error);
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
