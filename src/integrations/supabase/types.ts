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
          cost_model: string | null
          created_at: string
          daily_budget: number | null
          id: string
          name: string
          offer_id: string | null
          redirect_mode: string | null
          status: string
          total_budget: number | null
          tracking_domain: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_model?: string | null
          created_at?: string
          daily_budget?: number | null
          id?: string
          name: string
          offer_id?: string | null
          redirect_mode?: string | null
          status?: string
          total_budget?: number | null
          tracking_domain?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_model?: string | null
          created_at?: string
          daily_budget?: number | null
          id?: string
          name?: string
          offer_id?: string | null
          redirect_mode?: string | null
          status?: string
          total_budget?: number | null
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
      click_rate_limits: {
        Row: {
          click_count: number
          created_at: string
          id: string
          ip_address: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          ip_address: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          ip_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      clicks: {
        Row: {
          bot_score: number | null
          browser: string | null
          campaign_id: string
          city: string | null
          click_id: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          is_bot: boolean | null
          os: string | null
          referrer: string | null
          sub_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          bot_score?: number | null
          browser?: string | null
          campaign_id: string
          city?: string | null
          click_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_bot?: boolean | null
          os?: string | null
          referrer?: string | null
          sub_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          bot_score?: number | null
          browser?: string | null
          campaign_id?: string
          city?: string | null
          click_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_bot?: boolean | null
          os?: string | null
          referrer?: string | null
          sub_id?: string | null
          user_agent?: string | null
          user_id?: string
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
          campaign_id: string
          click_id: string
          created_at: string
          currency: string
          id: string
          network_postback_raw: Json | null
          payout: number
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          click_id: string
          created_at?: string
          currency?: string
          id?: string
          network_postback_raw?: Json | null
          payout: number
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          click_id?: string
          created_at?: string
          currency?: string
          id?: string
          network_postback_raw?: Json | null
          payout?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["id"]
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
          network: string | null
          offer_url: string
          payout: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          currency?: string
          daily_cap?: number | null
          id?: string
          name: string
          network?: string | null
          offer_url: string
          payout: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          currency?: string
          daily_cap?: number | null
          id?: string
          name?: string
          network?: string | null
          offer_url?: string
          payout?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          secret_key: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          secret_key?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          secret_key?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secret_key_rotations: {
        Row: {
          id: string
          ip_address: string | null
          old_key_hash: string
          rotated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          old_key_hash: string
          rotated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          old_key_hash?: string
          rotated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_security_token_for_click: {
        Args: { click_id_param: string }
        Returns: string
      }
      get_available_offers: {
        Args: never
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
      get_user_secret_key_masked: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rotate_user_secret_key: { Args: never; Returns: string }
      validate_postback_security_token: {
        Args: { _click_id: string; _token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "affiliate" | "manager"
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
      app_role: ["admin", "affiliate", "manager"],
    },
  },
} as const
