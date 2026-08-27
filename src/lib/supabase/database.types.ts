// Auto-generated via `mcp__Supabase__generate_typescript_types`.
// Regenerate after schema changes — do not hand-edit.
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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          duration_minutes: number
          id: string
          price_cents: number
          salon_id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          appointment_id: string
          duration_minutes: number
          id?: string
          price_cents: number
          salon_id: string
          service_id: string
          sort_order?: number
        }
        Update: {
          appointment_id?: string
          duration_minutes?: number
          id?: string
          price_cents?: number
          salon_id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          customer_id: string
          employee_id: string
          end_at: string
          id: string
          notes: string | null
          period: unknown
          salon_id: string
          source: string
          start_at: string
          status: string
          total_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          employee_id: string
          end_at: string
          id?: string
          notes?: string | null
          period?: unknown
          salon_id: string
          source?: string
          start_at: string
          status?: string
          total_price_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          employee_id?: string
          end_at?: string
          id?: string
          notes?: string | null
          period?: unknown
          salon_id?: string
          source?: string
          start_at?: string
          status?: string
          total_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          salon_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          salon_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_closed: boolean
          salon_id: string
          start_time: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          salon_id: string
          start_time?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          salon_id?: string
          start_time?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_requests: {
        Row: {
          call_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          note: string | null
          phone_number: string
          reason: string | null
          requested_at: string
          salon_id: string
          status: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string | null
          phone_number: string
          reason?: string | null
          requested_at?: string
          salon_id: string
          status?: string
        }
        Update: {
          call_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string | null
          phone_number?: string
          reason?: string | null
          requested_at?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_requests_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callback_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callback_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          appointment_id: string | null
          created_at: string
          customer_id: string | null
          direction: string
          duration_seconds: number
          id: string
          outcome: string | null
          phone_number: string | null
          provider_call_id: string | null
          salon_id: string
          started_at: string
          status: string
          topic: string | null
          transcript: Json
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number
          id?: string
          outcome?: string | null
          phone_number?: string | null
          provider_call_id?: string | null
          salon_id: string
          started_at?: string
          status?: string
          topic?: string | null
          transcript?: Json
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number
          id?: string
          outcome?: string | null
          phone_number?: string | null
          provider_call_id?: string | null
          salon_id?: string
          started_at?: string
          status?: string
          topic?: string | null
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "calls_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string
          preferred_employee_id: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone: string
          preferred_employee_id?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          preferred_employee_id?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_preferred_employee_id_fkey"
            columns: ["preferred_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_absences: {
        Row: {
          created_at: string
          employee_id: string
          end_at: string
          id: string
          note: string | null
          salon_id: string
          start_at: string
          type: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_at: string
          id?: string
          note?: string | null
          salon_id: string
          start_at: string
          type?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_at?: string
          id?: string
          note?: string | null
          salon_id?: string
          start_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_absences_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_services: {
        Row: {
          duration_minutes: number | null
          employee_id: string
          salon_id: string
          service_id: string
        }
        Insert: {
          duration_minutes?: number | null
          employee_id: string
          salon_id: string
          service_id: string
        }
        Update: {
          duration_minutes?: number | null
          employee_id?: string
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_services_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_working_hours: {
        Row: {
          created_at: string
          employee_id: string
          end_time: string
          id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_time: string
          id?: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_time?: string
          id?: string
          salon_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_working_hours_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          avatar_url: string | null
          color: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          salon_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          color?: string
          created_at?: string
          first_name: string
          id?: string
          last_name?: string
          salon_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          color?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          salon_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          address: string | null
          created_at: string
          distance_km: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          distance_km?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          distance_km?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      salon_users: {
        Row: {
          created_at: string
          id: string
          role: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_users_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          ai_active: boolean
          calendar_feed_token: string | null
          created_at: string
          earliest_booking_lead_minutes: number
          id: string
          logo_url: string | null
          max_advance_booking_days: number
          name: string
          phone: string | null
          slot_granularity_minutes: number
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          ai_active?: boolean
          calendar_feed_token?: string | null
          created_at?: string
          earliest_booking_lead_minutes?: number
          id?: string
          logo_url?: string | null
          max_advance_booking_days?: number
          name: string
          phone?: string | null
          slot_granularity_minutes?: number
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          ai_active?: boolean
          calendar_feed_token?: string | null
          created_at?: string
          earliest_booking_lead_minutes?: number
          id?: string
          logo_url?: string | null
          max_advance_booking_days?: number
          name?: string
          phone?: string | null
          slot_granularity_minutes?: number
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          buffer_after_minutes: number
          buffer_before_minutes: number
          category: string | null
          color: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price_cents: number
          salon_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category?: string | null
          color?: string
          created_at?: string
          duration_minutes: number
          id?: string
          name: string
          price_cents?: number
          salon_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category?: string | null
          color?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price_cents?: number
          salon_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_requests: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          plan: string
          reviewed_at: string | null
          reviewed_by: string | null
          salon_name: string
          status: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          plan: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_name: string
          status?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_name?: string
          status?: string
        }
        Relationships: []
      }
      voice_settings: {
        Row: {
          cancellation_notice_hours: number
          custom_prompt: string | null
          detect_new_customers: boolean
          elevenlabs_agent_id: string | null
          elevenlabs_voice_id: string | null
          emergency_redirect: boolean
          forwarding_number: string | null
          greeting: string
          mention_cancellation_policy: boolean
          mention_prices: boolean
          offer_alternatives: boolean
          offer_callback: boolean
          personality: string
          phone_number: string | null
          provider: string
          provider_agent_id: string | null
          provider_llm_id: string | null
          required_documents: string | null
          respect_employee_preference: boolean
          salon_id: string
          send_confirmation_sms: boolean
          updated_at: string
          voice_id: string
        }
        Insert: {
          cancellation_notice_hours?: number
          custom_prompt?: string | null
          detect_new_customers?: boolean
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          emergency_redirect?: boolean
          forwarding_number?: string | null
          greeting?: string
          mention_cancellation_policy?: boolean
          mention_prices?: boolean
          offer_alternatives?: boolean
          offer_callback?: boolean
          personality?: string
          phone_number?: string | null
          provider?: string
          provider_agent_id?: string | null
          provider_llm_id?: string | null
          required_documents?: string | null
          respect_employee_preference?: boolean
          salon_id: string
          send_confirmation_sms?: boolean
          updated_at?: string
          voice_id?: string
        }
        Update: {
          cancellation_notice_hours?: number
          custom_prompt?: string | null
          detect_new_customers?: boolean
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          emergency_redirect?: boolean
          forwarding_number?: string | null
          greeting?: string
          mention_cancellation_policy?: boolean
          mention_prices?: boolean
          offer_alternatives?: boolean
          offer_callback?: boolean
          personality?: string
          phone_number?: string | null
          provider?: string
          provider_agent_id?: string | null
          provider_llm_id?: string | null
          required_documents?: string | null
          respect_employee_preference?: boolean
          salon_id?: string
          send_confirmation_sms?: boolean
          updated_at?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_settings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment: {
        Args: {
          p_customer_id: string
          p_employee_id: string
          p_end_at: string
          p_notes?: string
          p_salon_id: string
          p_service_ids: string[]
          p_source?: string
          p_start_at: string
        }
        Returns: {
          created_at: string
          customer_id: string
          employee_id: string
          end_at: string
          id: string
          notes: string | null
          period: unknown
          salon_id: string
          source: string
          start_at: string
          status: string
          total_price_cents: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_salon_member: { Args: { target_salon_id: string }; Returns: boolean }
      regenerate_calendar_feed_token: {
        Args: { target_salon_id: string }
        Returns: string
      }
      toggle_salon_ai: {
        Args: { active: boolean; target_salon_id: string }
        Returns: undefined
      }
      update_voice_settings_customer_fields: {
        Args: {
          p_cancellation_notice_hours: number
          p_custom_prompt: string
          p_detect_new_customers: boolean
          p_emergency_redirect: boolean
          p_greeting: string
          p_mention_cancellation_policy: boolean
          p_mention_prices: boolean
          p_offer_alternatives: boolean
          p_offer_callback: boolean
          p_personality: string
          p_required_documents: string
          p_respect_employee_preference: boolean
          p_send_confirmation_sms: boolean
          target_salon_id: string
        }
        Returns: undefined
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
