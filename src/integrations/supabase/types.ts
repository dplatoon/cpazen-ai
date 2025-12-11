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
      automation_rules: {
        Row: {
          action_json: Json
          campaign_id: string
          condition_json: Json
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_json?: Json
          campaign_id: string
          condition_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_json?: Json
          campaign_id?: string
          condition_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost: number | null
          created_at: string
          date: string
          device: string | null
          geo: string | null
          id: string
          impressions: number | null
          os: string | null
          placement: string | null
          revenue: number | null
          sub_id: string | null
          traffic_source_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date: string
          device?: string | null
          geo?: string | null
          id?: string
          impressions?: number | null
          os?: string | null
          placement?: string | null
          revenue?: number | null
          sub_id?: string | null
          traffic_source_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date?: string
          device?: string | null
          geo?: string | null
          id?: string
          impressions?: number | null
          os?: string | null
          placement?: string | null
          revenue?: number | null
          sub_id?: string | null
          traffic_source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          cost_model: string | null
          created_at: string
          currency: string | null
          daily_budget: number | null
          devices: string[] | null
          id: string
          monthly_budget: number | null
          name: string
          offer_id: string | null
          os: string[] | null
          redirect_mode: string | null
          status: string
          target_cpa: number | null
          target_geo: string[] | null
          total_budget: number | null
          tracking_domain: string | null
          traffic_source_id: string | null
          updated_at: string
          user_id: string
          vertical: string | null
        }
        Insert: {
          cost_model?: string | null
          created_at?: string
          currency?: string | null
          daily_budget?: number | null
          devices?: string[] | null
          id?: string
          monthly_budget?: number | null
          name: string
          offer_id?: string | null
          os?: string[] | null
          redirect_mode?: string | null
          status?: string
          target_cpa?: number | null
          target_geo?: string[] | null
          total_budget?: number | null
          tracking_domain?: string | null
          traffic_source_id?: string | null
          updated_at?: string
          user_id: string
          vertical?: string | null
        }
        Update: {
          cost_model?: string | null
          created_at?: string
          currency?: string | null
          daily_budget?: number | null
          devices?: string[] | null
          id?: string
          monthly_budget?: number | null
          name?: string
          offer_id?: string | null
          os?: string[] | null
          redirect_mode?: string | null
          status?: string
          target_cpa?: number | null
          target_geo?: string[] | null
          total_budget?: number | null
          tracking_domain?: string | null
          traffic_source_id?: string | null
          updated_at?: string
          user_id?: string
          vertical?: string | null
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
          fraud_indicators: Json | null
          fraud_score: number | null
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
          fraud_indicators?: Json | null
          fraud_score?: number | null
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
          fraud_indicators?: Json | null
          fraud_score?: number | null
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
      experiments: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          metric: string
          min_data_threshold: number | null
          name: string
          status: string
          type: string
          updated_at: string
          user_id: string
          variants: Json
          winner_variant_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          metric?: string
          min_data_threshold?: number | null
          name: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
          variants?: Json
          winner_variant_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          metric?: string
          min_data_threshold?: number | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          variants?: Json
          winner_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          campaign_id: string | null
          click_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          alert_type: string
          campaign_id?: string | null
          click_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          campaign_id?: string | null
          click_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_alerts_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_patterns: {
        Row: {
          confidence_score: number
          created_at: string | null
          false_positive_count: number | null
          id: string
          last_triggered_at: string | null
          pattern_data: Json
          pattern_type: string
          true_positive_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string | null
          false_positive_count?: number | null
          id?: string
          last_triggered_at?: string | null
          pattern_data: Json
          pattern_type: string
          true_positive_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          false_positive_count?: number | null
          id?: string
          last_triggered_at?: string | null
          pattern_data?: Json
          pattern_type?: string
          true_positive_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ip_blacklist: {
        Row: {
          auto_detected: boolean | null
          campaign_id: string | null
          created_at: string | null
          id: string
          ip_address: string
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_detected?: boolean | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_detected?: boolean | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_blacklist_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          ip_address: string
          note: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          note?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          note?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_whitelist_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          email_to: string
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          email_to: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          email_to?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
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
          notification_preferences: Json | null
          secret_key: string
          status: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          notification_preferences?: Json | null
          secret_key?: string
          status?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          notification_preferences?: Json | null
          secret_key?: string
          status?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          campaign_id: string
          confidence_score: number | null
          created_at: string
          description: string
          expected_impact: Json | null
          id: string
          scope: Json | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          confidence_score?: number | null
          created_at?: string
          description: string
          expected_impact?: Json | null
          id?: string
          scope?: Json | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          confidence_score?: number | null
          created_at?: string
          description?: string
          expected_impact?: Json | null
          id?: string
          scope?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_logs: {
        Row: {
          delivered_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          user_id: string
          webhook_id: string
        }
        Insert: {
          delivered_at?: string
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          user_id: string
          webhook_id: string
        }
        Update: {
          delivered_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          user_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_retry_queue: {
        Row: {
          attempt: number
          completed_at: string | null
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          max_retries: number
          next_retry_at: string
          original_log_id: string | null
          payload: Json
          status: string
          user_id: string
          webhook_id: string
        }
        Insert: {
          attempt?: number
          completed_at?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at: string
          original_log_id?: string | null
          payload: Json
          status?: string
          user_id: string
          webhook_id: string
        }
        Update: {
          attempt?: number
          completed_at?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at?: string
          original_log_id?: string | null
          payload?: Json
          status?: string
          user_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_retry_queue_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_test_logs: {
        Row: {
          id: string
          response_body: string | null
          response_status: number | null
          response_time_ms: number | null
          test_payload: Json
          tested_at: string | null
          user_id: string
          webhook_id: string | null
        }
        Insert: {
          id?: string
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          test_payload: Json
          tested_at?: string | null
          user_id: string
          webhook_id?: string | null
        }
        Update: {
          id?: string
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          test_payload?: Json
          tested_at?: string | null
          user_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_test_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret_key: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret_key?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret_key?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_offer: {
        Args: {
          p_countries?: string[]
          p_currency?: string
          p_daily_cap?: number
          p_name: string
          p_network?: string
          p_offer_url: string
          p_payout: number
          p_status?: string
          p_user_id?: string
        }
        Returns: string
      }
      admin_delete_offer: { Args: { p_offer_id: string }; Returns: boolean }
      admin_update_offer: {
        Args: {
          p_countries?: string[]
          p_currency?: string
          p_daily_cap?: number
          p_name?: string
          p_network?: string
          p_offer_id: string
          p_offer_url?: string
          p_payout?: number
          p_status?: string
        }
        Returns: boolean
      }
      admin_update_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      admin_update_user_status: {
        Args: { p_status: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_security_token_for_click: {
        Args: { click_id_param: string }
        Returns: string
      }
      get_all_offers_admin: {
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
          owner_email: string
          payout: number
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_all_users_admin: {
        Args: never
        Returns: {
          company_name: string
          created_at: string
          email: string
          role: string
          status: string
          timezone: string
          updated_at: string
          user_id: string
        }[]
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
      get_global_offers: {
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
        }[]
      }
      get_user_activity_admin: {
        Args: { p_user_id: string }
        Returns: {
          activity_type: string
          created_at: string
          description: string
          metadata: Json
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
