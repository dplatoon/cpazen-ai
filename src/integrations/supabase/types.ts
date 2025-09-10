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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          cost_model: string
          created_at: string
          id: string
          name: string
          offer_id: string
          redirect_mode: string
          status: string
          tracking_domain: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_model?: string
          created_at?: string
          id?: string
          name: string
          offer_id: string
          redirect_mode?: string
          status?: string
          tracking_domain?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_model?: string
          created_at?: string
          id?: string
          name?: string
          offer_id?: string
          redirect_mode?: string
          status?: string
          tracking_domain?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks: {
        Row: {
          bot_score: number | null
          browser: string | null
          campaign_id: string
          click_id: string
          country: string | null
          created_at: string
          id: string
          ip: unknown | null
          os: string | null
          referrer: string | null
          sub_id: string | null
          user_agent: string | null
        }
        Insert: {
          bot_score?: number | null
          browser?: string | null
          campaign_id: string
          click_id?: string
          country?: string | null
          created_at?: string
          id?: string
          ip?: unknown | null
          os?: string | null
          referrer?: string | null
          sub_id?: string | null
          user_agent?: string | null
        }
        Update: {
          bot_score?: number | null
          browser?: string | null
          campaign_id?: string
          click_id?: string
          country?: string | null
          created_at?: string
          id?: string
          ip?: unknown | null
          os?: string | null
          referrer?: string | null
          sub_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      conversions: {
        Row: {
          click_id: string
          created_at: string
          id: string
          network_postback_raw: Json | null
          payout: number
          status: string
          updated_at: string
        }
        Insert: {
          click_id: string
          created_at?: string
          id?: string
          network_postback_raw?: Json | null
          payout?: number
          status?: string
          updated_at?: string
        }
        Update: {
          click_id?: string
          created_at?: string
          id?: string
          network_postback_raw?: Json | null
          payout?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: true
            referencedRelation: "clicks"
            referencedColumns: ["click_id"]
          },
        ]
      }
      offers: {
        Row: {
          countries: string[] | null
          created_at: string
          currency: string
          daily_cap: number | null
          id: string
          name: string
          network: string
          offer_url: string
          payout: number
          status: string
          updated_at: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          currency?: string
          daily_cap?: number | null
          id?: string
          name: string
          network: string
          offer_url: string
          payout?: number
          status?: string
          updated_at?: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          currency?: string
          daily_cap?: number | null
          id?: string
          name?: string
          network?: string
          offer_url?: string
          payout?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          role: string
          secret_key: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          role?: string
          secret_key?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: string
          secret_key?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      rules: {
        Row: {
          action_json: Json
          active: boolean
          condition_json: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_json: Json
          active?: boolean
          condition_json: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_json?: Json
          active?: boolean
          condition_json?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_offer: {
        Args: { offer_uuid: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          action_name: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      generate_security_token_for_click: {
        Args: { click_id_param: string }
        Returns: string
      }
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          created_at: string
          email: string
          id: string
          role: string
          timezone: string
          updated_at: string
          user_id: string
        }[]
      }
      get_available_offers: {
        Args: Record<PropertyKey, never>
        Returns: {
          countries: string[]
          created_at: string
          currency: string
          daily_cap: number
          id: string
          name: string
          network: string
          offer_url: string
          payout: number
          status: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_secret_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_secret_key_masked: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_system_service: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_action: string
          event_details?: Json
          event_table: string
        }
        Returns: undefined
      }
      rotate_user_secret_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_postback_security_token: {
        Args: { click_id_param: string; provided_token: string }
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
