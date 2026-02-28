import { supabase } from '../../lib/supabase';

export interface PriceSheetRow {
  id: string;
  device_id: string;
  service_id: string;
  price: string; // numeric stored as string from Postgres
  is_active: boolean;
  created_at: string;
}

export interface PriceSheetRowWithNames extends PriceSheetRow {
  device_name?: string | null;
  service_name?: string | null;
}

export const priceSheetService = {
  async getPriceSheets(): Promise<PriceSheetRow[]> {
    try {
      const { data, error } = await supabase
        .from('price_sheet')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching price sheet:', error);
        return [];
      }

      return (data || []) as PriceSheetRow[];
    } catch (err) {
      console.error('Error fetching price sheet:', err);
      return [];
    }
  },
  async getPriceSheetsWithNames(): Promise<PriceSheetRowWithNames[]> {
    try {
      const rows = await this.getPriceSheets();

      // fetch devices and services in bulk
      const deviceIds = Array.from(new Set(rows.map((r) => r.device_id).filter(Boolean)));
      const serviceIds = Array.from(new Set(rows.map((r) => r.service_id).filter(Boolean)));

      const deviceMap: Record<string, string> = {};
      const serviceMap: Record<string, string> = {};

      if (deviceIds.length > 0) {
        const { data: devices } = await supabase.from('devices').select('id, name').in('id', deviceIds as string[]);
        (devices || []).forEach((d: any) => {
          deviceMap[d.id] = d.name;
        });
      }

      if (serviceIds.length > 0) {
        const { data: services } = await supabase.from('services').select('id, name').in('id', serviceIds as string[]);
        (services || []).forEach((s: any) => {
          serviceMap[s.id] = s.name;
        });
      }

      return rows.map((r) => ({
        ...r,
        device_name: deviceMap[r.device_id] ?? null,
        service_name: serviceMap[r.service_id] ?? null,
      }));
    } catch (err) {
      console.error('Error fetching price sheets with names:', err);
      return [];
    }
  },
  async searchPriceSheets(searchTerm: string): Promise<PriceSheetRowWithNames[]> {
    if (!searchTerm.trim()) return [];
    try {
      const { data, error } = await supabase.rpc('search_price_sheet', {
        search_term: searchTerm.trim(),
      });
      if (error) {
        console.error('Error searching price sheet:', error);
        return [];
      }
      return (data || []) as PriceSheetRowWithNames[];
    } catch (err) {
      console.error('Error searching price sheet:', err);
      return [];
    }
  },
  async getAllDevices(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as { id: string; name: string }[];
  },
  async getAllServices(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as { id: string; name: string }[];
  },
  async createDevice(name: string, brand: string, category: string): Promise<string> {
    const { data, error } = await supabase
      .from('devices')
      .insert({ name: name.trim(), brand: brand.trim(), category: category.trim() })
      .select('id')
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  },
  async createService(name: string): Promise<string> {
    const { data, error } = await supabase
      .from('services')
      .insert({ name: name.trim() })
      .select('id')
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  },
  async createPriceEntry(deviceId: string, serviceId: string, price: number): Promise<void> {
    const { error } = await supabase
      .from('price_sheet')
      .insert({ device_id: deviceId, service_id: serviceId, price });
    if (error) throw error;
  },
  async updatePriceEntry(id: string, deviceId: string, serviceId: string, price: number): Promise<void> {
    const { error } = await supabase
      .from('price_sheet')
      .update({ device_id: deviceId, service_id: serviceId, price })
      .eq('id', id);
    if (error) throw error;
  },
  async deletePriceEntry(id: string): Promise<void> {
    const { error } = await supabase.from('price_sheet').delete().eq('id', id);
    if (error) throw error;
  },
};
