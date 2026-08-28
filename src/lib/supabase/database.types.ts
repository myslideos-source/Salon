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
      appointment_answers: {
        Row: {
          answer: string | null
          appointment_id: string
          created_at: string
          id: string
          question: string
          salon_id: string
        }
        Insert: {
          answer?: string | null
          appointment_id: string
          created_at?: string
          id?: string
          question: string
          salon_id: string
        }
        Update: {
          answer?: string | null
          appointment_id?: string
          created_at?: string
          id?: string
          question?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_answers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_answers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_resources: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          resource_id: string
          salon_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          resource_id: string
          salon_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          resource_id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_resources_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_resources_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      business_hour_exceptions: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_closed: boolean
          location_id: string | null
          note: string | null
          salon_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          location_id?: string | null
          note?: string | null
          salon_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          location_id?: string | null
          note?: string | null
          salon_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hour_exceptions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hour_exceptions_salon_id_fkey"
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
          location_id: string | null
          salon_id: string
          start_time: string | null
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          location_id?: string | null
          salon_id: string
          start_time?: string | null
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          location_id?: string | null
          salon_id?: string
          start_time?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
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
      callback_windows: {
        Row: {
          created_at: string
          end_time: string
          id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          salon_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "callback_windows_salon_id_fkey"
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
          consent_recording: boolean | null
          created_at: string
          customer_id: string | null
          direction: string
          duration_seconds: number
          id: string
          notes: string | null
          outcome: string | null
          phone_number: string | null
          provider_call_id: string | null
          recording_url: string | null
          resolved: boolean
          salon_id: string
          sentiment: string | null
          started_at: string
          status: string
          summary: string | null
          topic: string | null
          transcript: Json
          urgency: string | null
        }
        Insert: {
          appointment_id?: string | null
          consent_recording?: boolean | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number
          id?: string
          notes?: string | null
          outcome?: string | null
          phone_number?: string | null
          provider_call_id?: string | null
          recording_url?: string | null
          resolved?: boolean
          salon_id: string
          sentiment?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          topic?: string | null
          transcript?: Json
          urgency?: string | null
        }
        Update: {
          appointment_id?: string | null
          consent_recording?: boolean | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number
          id?: string
          notes?: string | null
          outcome?: string | null
          phone_number?: string | null
          provider_call_id?: string | null
          recording_url?: string | null
          resolved?: boolean
          salon_id?: string
          sentiment?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          topic?: string | null
          transcript?: Json
          urgency?: string | null
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
      custom_field_definitions: {
        Row: {
          active: boolean
          created_at: string
          entity_type: string
          field_type: string
          id: string
          key: string
          label: string
          options: Json
          required: boolean
          salon_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          entity_type: string
          field_type?: string
          id?: string
          key: string
          label: string
          options?: Json
          required?: boolean
          salon_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json
          required?: boolean
          salon_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          consent_marketing: boolean
          consent_recording: boolean
          created_at: string
          custom_fields: Json
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string
          preferred_employee_id: string | null
          preferred_location_id: string | null
          salon_id: string
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          consent_marketing?: boolean
          consent_recording?: boolean
          created_at?: string
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone: string
          preferred_employee_id?: string | null
          preferred_location_id?: string | null
          salon_id: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          consent_marketing?: boolean
          consent_recording?: boolean
          created_at?: string
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          preferred_employee_id?: string | null
          preferred_location_id?: string | null
          salon_id?: string
          status?: string
          tags?: string[]
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
            foreignKeyName: "customers_preferred_location_id_fkey"
            columns: ["preferred_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
          salon_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          active: boolean
          answer: string
          category: string | null
          created_at: string
          id: string
          question: string
          salon_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          question: string
          salon_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          question?: string
          salon_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          example_custom_questions: Json
          example_required_fields: Json
          example_services: Json
          id: string
          key: string
          name: string
          sort_order: number
          terminology: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_custom_questions?: Json
          example_required_fields?: Json
          example_services?: Json
          id?: string
          key: string
          name: string
          sort_order?: number
          terminology?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          example_custom_questions?: Json
          example_required_fields?: Json
          example_services?: Json
          id?: string
          key?: string
          name?: string
          sort_order?: number
          terminology?: Json
        }
        Relationships: []
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          phone: string | null
          salon_id: string
          sort_order: number
          timezone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          salon_id: string
          sort_order?: number
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          phone?: string | null
          salon_id?: string
          sort_order?: number
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          salon_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          salon_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          salon_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_salon_id_fkey"
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
      requests: {
        Row: {
          assigned_employee_id: string | null
          attachments: Json
          call_id: string | null
          category: string
          created_at: string
          customer_id: string | null
          description: string | null
          desired_callback_from: string | null
          desired_callback_to: string | null
          id: string
          notes: string | null
          salon_id: string
          status: string
          subject: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          assigned_employee_id?: string | null
          attachments?: Json
          call_id?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          desired_callback_from?: string | null
          desired_callback_to?: string | null
          id?: string
          notes?: string | null
          salon_id: string
          status?: string
          subject?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          assigned_employee_id?: string | null
          attachments?: Json
          call_id?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          desired_callback_from?: string | null
          desired_callback_to?: string | null
          id?: string
          notes?: string | null
          salon_id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_working_hours: {
        Row: {
          created_at: string
          end_time: string
          id: string
          resource_id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          resource_id: string
          salon_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          resource_id?: string
          salon_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_working_hours_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_working_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          active: boolean
          color: string
          created_at: string
          description: string | null
          id: string
          location_id: string | null
          name: string
          salon_id: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          name: string
          salon_id: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          name?: string
          salon_id?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission_key: string
          role: string
          salon_id: string | null
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_key: string
          role: string
          salon_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission_key?: string
          role?: string
          salon_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
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
          description: string | null
          earliest_booking_lead_minutes: number
          id: string
          industry_template_id: string | null
          logo_url: string | null
          max_advance_booking_days: number
          max_appointments_per_day: number | null
          max_parallel_appointments: number | null
          name: string
          onboarding_completed_at: string | null
          onboarding_draft: Json
          onboarding_step: number
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
          description?: string | null
          earliest_booking_lead_minutes?: number
          id?: string
          industry_template_id?: string | null
          logo_url?: string | null
          max_advance_booking_days?: number
          max_appointments_per_day?: number | null
          max_parallel_appointments?: number | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_draft?: Json
          onboarding_step?: number
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
          description?: string | null
          earliest_booking_lead_minutes?: number
          id?: string
          industry_template_id?: string | null
          logo_url?: string | null
          max_advance_booking_days?: number
          max_appointments_per_day?: number | null
          max_parallel_appointments?: number | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_draft?: Json
          onboarding_step?: number
          phone?: string | null
          slot_granularity_minutes?: number
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salons_industry_template_id_fkey"
            columns: ["industry_template_id"]
            isOneToOne: false
            referencedRelation: "industry_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_resources: {
        Row: {
          resource_id: string
          salon_id: string
          service_id: string
        }
        Insert: {
          resource_id: string
          salon_id: string
          service_id: string
        }
        Update: {
          resource_id?: string
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          bookable_online: boolean
          bookable_phone: boolean
          buffer_after_minutes: number
          buffer_before_minutes: number
          category: string | null
          color: string
          created_at: string
          custom_questions: Json
          description: string | null
          duration_minutes: number
          has_price: boolean
          id: string
          location_id: string | null
          name: string
          price_cents: number
          required_customer_fields: Json
          salon_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bookable_online?: boolean
          bookable_phone?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category?: string | null
          color?: string
          created_at?: string
          custom_questions?: Json
          description?: string | null
          duration_minutes: number
          has_price?: boolean
          id?: string
          location_id?: string | null
          name: string
          price_cents?: number
          required_customer_fields?: Json
          salon_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bookable_online?: boolean
          bookable_phone?: boolean
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          category?: string | null
          color?: string
          created_at?: string
          custom_questions?: Json
          description?: string | null
          duration_minutes?: number
          has_price?: boolean
          id?: string
          location_id?: string | null
          name?: string
          price_cents?: number
          required_customer_fields?: Json
          salon_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
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
          after_hours_behavior: string
          assistant_name: string
          cancellation_notice_hours: number
          custom_prompt: string | null
          detect_new_customers: boolean
          elevenlabs_agent_id: string | null
          elevenlabs_voice_id: string | null
          emergency_redirect: boolean
          formality: string
          forwarding_number: string | null
          greeting: string
          handoff_number: string | null
          languages: string[]
          mention_cancellation_policy: boolean
          mention_prices: boolean
          never_mention: string | null
          notify_after_call: boolean
          offer_alternatives: boolean
          offer_callback: boolean
          personality: string
          phone_number: string | null
          provider: string
          provider_agent_id: string | null
          provider_llm_id: string | null
          recording_enabled: boolean
          required_documents: string | null
          respect_employee_preference: boolean
          salon_id: string
          send_confirmation_sms: boolean
          twilio_phone_number_sid: string | null
          updated_at: string
          urgent_keywords: string[]
          voice_id: string
        }
        Insert: {
          after_hours_behavior?: string
          assistant_name?: string
          cancellation_notice_hours?: number
          custom_prompt?: string | null
          detect_new_customers?: boolean
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          emergency_redirect?: boolean
          formality?: string
          forwarding_number?: string | null
          greeting?: string
          handoff_number?: string | null
          languages?: string[]
          mention_cancellation_policy?: boolean
          mention_prices?: boolean
          never_mention?: string | null
          notify_after_call?: boolean
          offer_alternatives?: boolean
          offer_callback?: boolean
          personality?: string
          phone_number?: string | null
          provider?: string
          provider_agent_id?: string | null
          provider_llm_id?: string | null
          recording_enabled?: boolean
          required_documents?: string | null
          respect_employee_preference?: boolean
          salon_id: string
          send_confirmation_sms?: boolean
          twilio_phone_number_sid?: string | null
          updated_at?: string
          urgent_keywords?: string[]
          voice_id?: string
        }
        Update: {
          after_hours_behavior?: string
          assistant_name?: string
          cancellation_notice_hours?: number
          custom_prompt?: string | null
          detect_new_customers?: boolean
          elevenlabs_agent_id?: string | null
          elevenlabs_voice_id?: string | null
          emergency_redirect?: boolean
          formality?: string
          forwarding_number?: string | null
          greeting?: string
          handoff_number?: string | null
          languages?: string[]
          mention_cancellation_policy?: boolean
          mention_prices?: boolean
          never_mention?: string | null
          notify_after_call?: boolean
          offer_alternatives?: boolean
          offer_callback?: boolean
          personality?: string
          phone_number?: string | null
          provider?: string
          provider_agent_id?: string | null
          provider_llm_id?: string | null
          recording_enabled?: boolean
          required_documents?: string | null
          respect_employee_preference?: boolean
          salon_id?: string
          send_confirmation_sms?: boolean
          twilio_phone_number_sid?: string | null
          updated_at?: string
          urgent_keywords?: string[]
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
          location_id: string | null
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
      complete_own_salon_onboarding: {
        Args: { target_salon_id: string }
        Returns: undefined
      }
      create_own_salon: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      current_salon_role: { Args: { target_salon_id: string }; Returns: string }
      delete_customer_data: {
        Args: { target_customer_id: string }
        Returns: undefined
      }
      export_customer_data: {
        Args: { target_customer_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { p_permission_key: string; target_salon_id: string }
        Returns: boolean
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
      update_call_recording_consent: {
        Args: { p_recording_enabled: boolean; target_salon_id: string }
        Returns: undefined
      }
      update_own_booking_rules: {
        Args: {
          p_earliest_booking_lead_minutes: number
          p_max_advance_booking_days: number
          p_max_appointments_per_day?: number
          p_max_parallel_appointments?: number
          p_slot_granularity_minutes: number
          target_salon_id: string
        }
        Returns: undefined
      }
      update_own_salon_onboarding: {
        Args: {
          p_address?: string
          p_description?: string
          p_industry_template_id?: string
          p_name?: string
          p_onboarding_draft?: Json
          p_onboarding_step?: number
          p_phone?: string
          p_slug?: string
          p_timezone?: string
          target_salon_id: string
        }
        Returns: undefined
      }
      update_voice_settings_customer_fields: {
        Args: {
          p_after_hours_behavior: string
          p_assistant_name: string
          p_cancellation_notice_hours: number
          p_custom_prompt: string
          p_detect_new_customers: boolean
          p_emergency_redirect: boolean
          p_formality: string
          p_greeting: string
          p_handoff_number: string
          p_languages: string[]
          p_mention_cancellation_policy: boolean
          p_mention_prices: boolean
          p_never_mention: string
          p_notify_after_call: boolean
          p_offer_alternatives: boolean
          p_offer_callback: boolean
          p_personality: string
          p_required_documents: string
          p_respect_employee_preference: boolean
          p_send_confirmation_sms: boolean
          p_urgent_keywords: string[]
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
