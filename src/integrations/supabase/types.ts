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
          created_at: string
          daily_budget: number | null
          id: string
          name: string
          offer_id: string | null
          status: string
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_budget?: number | null
          id?: string
          name: string
          offer_id?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_budget?: number | null
          id?: string
          name?: string
          offer_id?: string | null
          status?: string
          total_budget?: number | null
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
          browser: string | null
          campaign_id: string
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          is_bot: boolean | null
          os: string | null
          sub_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          campaign_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_bot?: boolean | null
          os?: string | null
          sub_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          campaign_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_bot?: boolean | null
          os?: string | null
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
          role: string
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
          role?: string
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
          role?: string
          secret_key?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      rotate_user_secret_key: { Args: never; Returns: string }
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
