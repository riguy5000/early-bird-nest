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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          full_name: string
          gender: string | null
          id: string
          id_scan_back_url: string | null
          id_scan_url: string | null
          last_name: string
          license_number: string | null
          notes: string | null
          ocr_payload: Json | null
          phone: string | null
          source: string
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          full_name?: string
          gender?: string | null
          id?: string
          id_scan_back_url?: string | null
          id_scan_url?: string | null
          last_name?: string
          license_number?: string | null
          notes?: string | null
          ocr_payload?: Json | null
          phone?: string | null
          source?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          full_name?: string
          gender?: string | null
          id?: string
          id_scan_back_url?: string | null
          id_scan_url?: string | null
          last_name?: string
          license_number?: string | null
          notes?: string | null
          ocr_payload?: Json | null
          phone?: string | null
          source?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          can_access_customers: boolean
          can_access_inventory: boolean
          can_access_payouts: boolean
          can_access_saved_for_later: boolean
          can_access_settings: boolean
          can_access_statistics: boolean
          can_access_take_in: boolean
          can_complete_purchase: boolean
          can_delete_items: boolean
          can_edit_final_payout_amount: boolean
          can_edit_rates: boolean
          can_print_labels: boolean
          can_print_receipts: boolean
          can_reopen_transactions: boolean
          created_at: string
          employee_profile_id: string
          id: string
          updated_at: string
        }
        Insert: {
          can_access_customers?: boolean
          can_access_inventory?: boolean
          can_access_payouts?: boolean
          can_access_saved_for_later?: boolean
          can_access_settings?: boolean
          can_access_statistics?: boolean
          can_access_take_in?: boolean
          can_complete_purchase?: boolean
          can_delete_items?: boolean
          can_edit_final_payout_amount?: boolean
          can_edit_rates?: boolean
          can_print_labels?: boolean
          can_print_receipts?: boolean
          can_reopen_transactions?: boolean
          created_at?: string
          employee_profile_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          can_access_customers?: boolean
          can_access_inventory?: boolean
          can_access_payouts?: boolean
          can_access_saved_for_later?: boolean
          can_access_settings?: boolean
          can_access_statistics?: boolean
          can_access_take_in?: boolean
          can_complete_purchase?: boolean
          can_delete_items?: boolean
          can_edit_final_payout_amount?: boolean
          can_edit_rates?: boolean
          can_print_labels?: boolean
          can_print_receipts?: boolean
          can_reopen_transactions?: boolean
          created_at?: string
          employee_profile_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          invite_expires_at: string | null
          invite_status: string
          invite_token: string | null
          invited_by: string | null
          is_active: boolean
          last_login_at: string | null
          last_name: string
          phone: string | null
          role: string
          store_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string
          id?: string
          invite_expires_at?: string | null
          invite_status?: string
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          role?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          invite_expires_at?: string | null
          invite_status?: string
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          role?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_visibility_overrides: {
        Row: {
          created_at: string
          employee_profile_id: string
          hide_average_rate: boolean
          hide_market_value: boolean
          hide_percentage_paid: boolean
          hide_profit: boolean
          hide_total_payout_breakdown: boolean
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_profile_id: string
          hide_average_rate?: boolean
          hide_market_value?: boolean
          hide_percentage_paid?: boolean
          hide_profit?: boolean
          hide_total_payout_breakdown?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_profile_id?: string
          hide_average_rate?: boolean
          hide_market_value?: boolean
          hide_percentage_paid?: boolean
          hide_profit?: boolean
          hide_total_payout_breakdown?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_visibility_overrides_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_notes: string | null
          batch_photos: string[] | null
          created_at: string
          customer_id: string | null
          employee_id: string | null
          id: string
          source: string
          status: string
          store_id: string
          take_in_ref: string | null
          total_items: number
          total_payout: number
          updated_at: string
        }
        Insert: {
          batch_notes?: string | null
          batch_photos?: string[] | null
          created_at?: string
          customer_id?: string | null
          employee_id?: string | null
          id?: string
          source?: string
          status?: string
          store_id: string
          take_in_ref?: string | null
          total_items?: number
          total_payout?: number
          updated_at?: string
        }
        Update: {
          batch_notes?: string | null
          batch_photos?: string[] | null
          created_at?: string
          customer_id?: string | null
          employee_id?: string | null
          id?: string
          source?: string
          status?: string
          store_id?: string
          take_in_ref?: string | null
          total_items?: number
          total_payout?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          archive_date: string | null
          archive_reason: string | null
          batch_id: string | null
          category: string
          created_at: string
          customer_id: string | null
          description: string | null
          disposition: string
          employee_id: string | null
          estimated_resale_value: number | null
          estimated_scrap_value: number | null
          id: string
          is_archived: boolean | null
          is_part_out_eligible: boolean | null
          is_resellable: boolean | null
          is_scrap_eligible: boolean | null
          location: string | null
          location_notes: string | null
          market_value_at_intake: number | null
          metals: Json | null
          notes: string | null
          parent_item_id: string | null
          payout_amount: number | null
          payout_percentage: number | null
          photos: string[] | null
          processing_status: string
          refinery_lot_id: string | null
          sale_channel: string | null
          selling_price: number | null
          sent_to_refinery_date: string | null
          showroom_location: string | null
          showroom_ready: boolean | null
          sold_amount: number | null
          sold_date: string | null
          source: string
          stones: Json | null
          store_id: string
          subcategory: string | null
          take_in_item_ref: string | null
          test_method: string | null
          updated_at: string
          watch_info: Json | null
          weight: number | null
        }
        Insert: {
          archive_date?: string | null
          archive_reason?: string | null
          batch_id?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          disposition?: string
          employee_id?: string | null
          estimated_resale_value?: number | null
          estimated_scrap_value?: number | null
          id?: string
          is_archived?: boolean | null
          is_part_out_eligible?: boolean | null
          is_resellable?: boolean | null
          is_scrap_eligible?: boolean | null
          location?: string | null
          location_notes?: string | null
          market_value_at_intake?: number | null
          metals?: Json | null
          notes?: string | null
          parent_item_id?: string | null
          payout_amount?: number | null
          payout_percentage?: number | null
          photos?: string[] | null
          processing_status?: string
          refinery_lot_id?: string | null
          sale_channel?: string | null
          selling_price?: number | null
          sent_to_refinery_date?: string | null
          showroom_location?: string | null
          showroom_ready?: boolean | null
          sold_amount?: number | null
          sold_date?: string | null
          source?: string
          stones?: Json | null
          store_id: string
          subcategory?: string | null
          take_in_item_ref?: string | null
          test_method?: string | null
          updated_at?: string
          watch_info?: Json | null
          weight?: number | null
        }
        Update: {
          archive_date?: string | null
          archive_reason?: string | null
          batch_id?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          disposition?: string
          employee_id?: string | null
          estimated_resale_value?: number | null
          estimated_scrap_value?: number | null
          id?: string
          is_archived?: boolean | null
          is_part_out_eligible?: boolean | null
          is_resellable?: boolean | null
          is_scrap_eligible?: boolean | null
          location?: string | null
          location_notes?: string | null
          market_value_at_intake?: number | null
          metals?: Json | null
          notes?: string | null
          parent_item_id?: string | null
          payout_amount?: number | null
          payout_percentage?: number | null
          photos?: string[] | null
          processing_status?: string
          refinery_lot_id?: string | null
          sale_channel?: string | null
          selling_price?: number | null
          sent_to_refinery_date?: string | null
          showroom_location?: string | null
          showroom_ready?: boolean | null
          sold_amount?: number | null
          sold_date?: string | null
          source?: string
          stones?: Json | null
          store_id?: string
          subcategory?: string | null
          take_in_item_ref?: string | null
          test_method?: string | null
          updated_at?: string
          watch_info?: Json | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          field_changed: string
          id: string
          item_id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_changed: string
          id?: string
          item_id: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_changed?: string
          id?: string
          item_id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_status_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kv_store_62d2b480: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      metal_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          last_reset_at: string
          last_used_at: string | null
          monthly_limit: number
          provider: string
          requests_used: number
          sort_order: number
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          last_reset_at?: string
          last_used_at?: string | null
          monthly_limit?: number
          provider?: string
          requests_used?: number
          sort_order?: number
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          last_reset_at?: string
          last_used_at?: string | null
          monthly_limit?: number
          provider?: string
          requests_used?: number
          sort_order?: number
        }
        Relationships: []
      }
      metal_prices: {
        Row: {
          change_percent: number | null
          fetched_at: string
          id: string
          metal: string
          price_usd: number
          source: string | null
          symbol: string
        }
        Insert: {
          change_percent?: number | null
          fetched_at?: string
          id?: string
          metal: string
          price_usd: number
          source?: string | null
          symbol: string
        }
        Update: {
          change_percent?: number | null
          fetched_at?: string
          id?: string
          metal?: string
          price_usd?: number
          source?: string | null
          symbol?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      refinery_lots: {
        Row: {
          actual_settlement: number | null
          created_at: string
          difference: number | null
          expected_melt_value: number | null
          id: string
          item_ids: string[] | null
          lot_number: string
          notes: string | null
          sent_date: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          actual_settlement?: number | null
          created_at?: string
          difference?: number | null
          expected_melt_value?: number | null
          id?: string
          item_ids?: string[] | null
          lot_number?: string
          notes?: string | null
          sent_date?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          actual_settlement?: number | null
          created_at?: string
          difference?: number | null
          expected_melt_value?: number | null
          id?: string
          item_ids?: string[] | null
          lot_number?: string
          notes?: string | null
          sent_date?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refinery_lots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          advanced: Json
          appearance: Json
          compliance_settings: Json
          created_at: string
          customer_settings: Json
          employees: Json
          general: Json
          global_visibility: Json
          id: string
          intake_defaults: Json
          notification_settings: Json
          payout_defaults: Json
          print_settings: Json
          rate_defaults: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          advanced?: Json
          appearance?: Json
          compliance_settings?: Json
          created_at?: string
          customer_settings?: Json
          employees?: Json
          general?: Json
          global_visibility?: Json
          id?: string
          intake_defaults?: Json
          notification_settings?: Json
          payout_defaults?: Json
          print_settings?: Json
          rate_defaults?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          advanced?: Json
          appearance?: Json
          compliance_settings?: Json
          created_at?: string
          customer_settings?: Json
          employees?: Json
          general?: Json
          global_visibility?: Json
          id?: string
          intake_defaults?: Json
          notification_settings?: Json
          payout_defaults?: Json
          print_settings?: Json
          rate_defaults?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_auth_user_id: string
          phone: string | null
          status: string
          timezone: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_auth_user_id: string
          phone?: string | null
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_auth_user_id?: string
          phone?: string | null
          status?: string
          timezone?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_store_id: { Args: { _user_id: string }; Returns: string }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_store_member: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      owns_store: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
