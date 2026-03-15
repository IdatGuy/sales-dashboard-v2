export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      commissions: {
        Row: {
          accessory_sales: number | null
          created_at: string | null
          home_connects: number | null
          home_plus: number | null
          id: string
          month: string
          residuals: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessory_sales?: number | null
          created_at?: string | null
          home_connects?: number | null
          home_plus?: number | null
          id?: string
          month: string
          residuals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessory_sales?: number | null
          created_at?: string | null
          home_connects?: number | null
          home_plus?: number | null
          id?: string
          month?: string
          residuals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_list: {
        Row: {
          cancellation_reason: string | null
          check_in_date: string
          created_at: string
          cx_name: string
          cx_phone: string
          home_connect: boolean
          id: string
          is_depot_repair: boolean
          notes: string | null
          order_date: string | null
          part_description: string | null
          part_eta: string | null
          part_link: string | null
          return_required_reason: string | null
          status: string
          store_id: string
          technician: string
          wo_link: string
          wo_number: string
        }
        Insert: {
          cancellation_reason?: string | null
          check_in_date: string
          created_at?: string
          cx_name: string
          cx_phone: string
          home_connect?: boolean
          id?: string
          is_depot_repair?: boolean
          notes?: string | null
          order_date?: string | null
          part_description?: string | null
          part_eta?: string | null
          part_link?: string | null
          return_required_reason?: string | null
          status?: string
          store_id?: string
          technician: string
          wo_link: string
          wo_number: string
        }
        Update: {
          cancellation_reason?: string | null
          check_in_date?: string
          created_at?: string
          cx_name?: string
          cx_phone?: string
          home_connect?: boolean
          id?: string
          is_depot_repair?: boolean
          notes?: string | null
          order_date?: string | null
          part_description?: string | null
          part_eta?: string | null
          part_link?: string | null
          return_required_reason?: string | null
          status?: string
          store_id?: string
          technician?: string
          wo_link?: string
          wo_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_list_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_sheet: {
        Row: {
          created_at: string
          device_id: string
          id: string
          is_active: boolean
          price: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          is_active?: boolean
          price?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          is_active?: boolean
          price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_sheet_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_sheet_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          has_depot_access: boolean
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          has_depot_access?: boolean
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          has_depot_access?: boolean
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          metrics: Json
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          metrics?: Json
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          metrics?: Json
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_metric_definitions: {
        Row: {
          created_at: string | null
          id: string
          is_builtin: boolean
          is_deprecated: boolean
          is_visible: boolean
          key: string
          label: string
          sort_order: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_builtin?: boolean
          is_deprecated?: boolean
          is_visible?: boolean
          key: string
          label: string
          sort_order?: number
          unit_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_builtin?: boolean
          is_deprecated?: boolean
          is_visible?: boolean
          key?: string
          label?: string
          sort_order?: number
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      goal_definitions: {
        Row: {
          id: string
          name: string
          metric_keys: string[]
          unit_type: string
          sort_order: number
          is_deprecated: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          metric_keys: string[]
          unit_type: string
          sort_order?: number
          is_deprecated?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          metric_keys?: string[]
          unit_type?: string
          sort_order?: number
          is_deprecated?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_goals: {
        Row: {
          store_id: string // uuid
          month: string
          goal_definition_id: string
          target_value: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          store_id: string
          month: string
          goal_definition_id: string
          target_value?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          store_id?: string
          month?: string
          goal_definition_id?: string
          target_value?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_goals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_goals_goal_definition_id_fkey"
            columns: ["goal_definition_id"]
            isOneToOne: false
            referencedRelation: "goal_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          location: string
          name: string
          name_abbr: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          name: string
          name_abbr?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          name?: string
          name_abbr?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_store_access: {
        Row: {
          created_at: string | null
          id: string
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_store_access_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_price_sheet: {
        Args: { search_term: string }
        Returns: {
          created_at: string
          device_id: string
          device_name: string
          id: string
          is_active: boolean
          price: string
          service_id: string
          service_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      device_category:
        | "Phone"
        | "Tablet"
        | "Computer"
        | "Game Console"
        | "Other"
      user_role: "employee" | "manager" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      device_category: ["Phone", "Tablet", "Computer", "Game Console", "Other"],
      user_role: ["employee", "manager", "admin"],
    },
  },
} as const
