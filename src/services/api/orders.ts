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
  status: 'need to order' | 'ordered' | 'arrived' | 'installed' | 'completed';
  wo_link: string;
  part_link: string;
}

export const ordersService = {
  /**
   * Fetch all orders or orders for a specific store
   */
  async getOrders(storeId?: string): Promise<Order[]> {
    try {
      let query = supabase
        .from('order_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
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
   */
  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('order_list')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        return null;
      }

      return data as Order;
    } catch (error) {
      console.error('Error updating order:', error);
      return null;
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
