export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      documents: {
        Row: {
          category: string | null
          content_type: string | null
          created_at: string | null
          file_size: number | null
          file_url: string
          id: string
          name: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          name: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          name?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          accessory_sales: number | null
          cleanings: number | null
          created_at: string | null
          created_by: string | null
          date: string
          home_connects: number | null
          home_plus: number | null
          repairs: number | null
          sales_amount: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          accessory_sales?: number | null
          cleanings?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          home_connects?: number | null
          home_plus?: number | null
          repairs?: number | null
          sales_amount?: number
          store_id: string
          updated_at?: string | null
        }
        Update: {
          accessory_sales?: number | null
          cleanings?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          home_connects?: number | null
          home_plus?: number | null
          repairs?: number | null
          sales_amount?: number
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
      store_goals: {
        Row: {
          accessory_goal: number
          created_at: string | null
          home_connect_goal: number
          id: string
          month: string
          sales_goal: number
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          accessory_goal?: number
          created_at?: string | null
          home_connect_goal?: number
          id?: string
          month: string
          sales_goal?: number
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accessory_goal?: number
          created_at?: string | null
          home_connect_goal?: number
          id?: string
          month?: string
          sales_goal?: number
          store_id?: string | null
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
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          location: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          name?: string
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
          {
            foreignKeyName: "user_store_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_list: {
        Row: {
          id: number
          created_at: string
          check_in_date: string
          order_date: string | null
          part_eta: string | null
          home_connect: boolean
          wo_number: string
          part_description: string
          technician: string
          store_id: string
          cx_name: string
          cx_phone: string
          notes: string | null
          status: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed'
          wo_link: string
          part_link: string
        }
        Insert: {
          id?: number
          created_at?: string
          check_in_date: string
          order_date?: string | null
          part_eta?: string | null
          home_connect?: boolean
          wo_number: string
          part_description: string
          technician: string
          store_id?: string
          cx_name: string
          cx_phone: string
          notes?: string | null
          status?: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed'
          wo_link: string
          part_link: string
        }
        Update: {
          id?: number
          created_at?: string
          check_in_date?: string
          order_date?: string | null
          part_eta?: string | null
          home_connect?: boolean
          wo_number?: string
          part_description?: string
          technician?: string
          store_id?: string
          cx_name?: string
          cx_phone?: string
          notes?: string | null
          status?: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed'
          wo_link?: string
          part_link?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      part_status: 'need to order' | 'ordered' | 'received' | 'out of stock' | 'distro' | 'return required' | 'completed'
      user_role: "employee" | "manager" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["employee", "manager", "admin"],
    },
  },
} as const
