// services/SalesService.ts
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/database.types'

type Sale = Database['public']['Tables']['sales']['Row']

export class SalesService {
  static async getDailySales(storeId: string, month: string): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', `${month}-01`)
      .lt('date', `${month}-32`)

    if (error) {
      console.error(error)
      return []
    }

    return data || []
  }
}
