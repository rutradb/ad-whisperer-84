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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automated_rules: {
        Row: {
          action_type: string
          condition_metric: string
          condition_operator: string
          condition_value: number
          created_at: string
          date_preset: string
          entity_type: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_result: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type?: string
          condition_metric: string
          condition_operator: string
          condition_value: number
          created_at?: string
          date_preset?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_result?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          condition_metric?: string
          condition_operator?: string
          condition_value?: number
          created_at?: string
          date_preset?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_result?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_label_assignments: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          label_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          label_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          label_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "campaign_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      copy_history: {
        Row: {
          created_at: string
          framework: string
          id: string
          objective: string
          product_description: string
          target_audience: string
          tone: string
          user_id: string
          variation_count: number
          variations: Json
        }
        Insert: {
          created_at?: string
          framework?: string
          id?: string
          objective?: string
          product_description?: string
          target_audience?: string
          tone?: string
          user_id: string
          variation_count?: number
          variations?: Json
        }
        Update: {
          created_at?: string
          framework?: string
          id?: string
          objective?: string
          product_description?: string
          target_audience?: string
          tone?: string
          user_id?: string
          variation_count?: number
          variations?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anthropic_api_key: string | null
          cloud_run_url: string | null
          created_at: string
          email: string | null
          gads_account_json: Json | null
          gads_customer_id: string | null
          gads_login_customer_id: string | null
          gads_refresh_token: string | null
          google_ads_access_token: string | null
          google_ads_client_id: string | null
          google_ads_client_secret: string | null
          google_ads_customer_id: string | null
          google_ads_customer_json: Json | null
          google_ads_developer_token: string | null
          google_ads_login_customer_id: string | null
          google_ads_refresh_token: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          anthropic_api_key?: string | null
          cloud_run_url?: string | null
          created_at?: string
          email?: string | null
          gads_account_json?: Json | null
          gads_customer_id?: string | null
          gads_login_customer_id?: string | null
          gads_refresh_token?: string | null
          google_ads_access_token?: string | null
          google_ads_client_id?: string | null
          google_ads_client_secret?: string | null
          google_ads_customer_id?: string | null
          google_ads_customer_json?: Json | null
          google_ads_developer_token?: string | null
          google_ads_login_customer_id?: string | null
          google_ads_refresh_token?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          anthropic_api_key?: string | null
          cloud_run_url?: string | null
          created_at?: string
          email?: string | null
          gads_account_json?: Json | null
          gads_customer_id?: string | null
          gads_login_customer_id?: string | null
          gads_refresh_token?: string | null
          google_ads_access_token?: string | null
          google_ads_client_id?: string | null
          google_ads_client_secret?: string | null
          google_ads_customer_id?: string | null
          google_ads_customer_json?: Json | null
          google_ads_developer_token?: string | null
          google_ads_login_customer_id?: string | null
          google_ads_refresh_token?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          delivery_method: string | null
          delivery_target: string
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          next_send_at: string | null
          report_id: string
          time_of_day: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_method?: string | null
          delivery_target: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          report_id: string
          time_of_day?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_method?: string | null
          delivery_target?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          report_id?: string
          time_of_day?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "saved_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      targeting_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          name: string
          targeting_spec: Json
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          targeting_spec?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          targeting_spec?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          google_ads_access_token: string
          google_ads_customer_id: string
          google_ads_developer_token: string | null
          google_ads_refresh_token: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          google_ads_access_token: string
          google_ads_customer_id: string
          google_ads_developer_token?: string | null
          google_ads_refresh_token?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          google_ads_access_token?: string
          google_ads_customer_id?: string
          google_ads_developer_token?: string | null
          google_ads_refresh_token?: string | null
          id?: string
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
      calculate_next_send: {
        Args: {
          p_day_of_month: number
          p_day_of_week: number
          p_frequency: string
          p_time_of_day: string
          p_timezone: string
        }
        Returns: string
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
