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
      appointments: {
        Row: {
          animal_type: string
          breed: string
          created_at: string
          date: string
          duration_minutes: number
          id: string
          is_paid: boolean
          notes: string | null
          payment_method: string
          price: number
          service_id: string
          service_name: string
          size: string
          status: string
          time: string
          user_id: string
        }
        Insert: {
          animal_type: string
          breed: string
          created_at?: string
          date: string
          duration_minutes: number
          id?: string
          is_paid?: boolean
          notes?: string | null
          payment_method?: string
          price: number
          service_id: string
          service_name: string
          size: string
          status?: string
          time: string
          user_id: string
        }
        Update: {
          animal_type?: string
          breed?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          is_paid?: boolean
          notes?: string | null
          payment_method?: string
          price?: number
          service_id?: string
          service_name?: string
          size?: string
          status?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string
          updated_at: string
        }
        Insert: {
          close_time?: string
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string
          updated_at?: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          loyal_only: boolean
          percentage: number
          service_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          loyal_only?: boolean
          percentage?: number
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          loyal_only?: boolean
          percentage?: number
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_settings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          age: number
          allergies: string[] | null
          breed: string
          created_at: string
          date_of_birth: string | null
          id: string
          last_visit: string | null
          name: string
          notes: string | null
          photo: string
          size: string
          type: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          age?: number
          allergies?: string[] | null
          breed?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          last_visit?: string | null
          name: string
          notes?: string | null
          photo?: string
          size?: string
          type?: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          age?: number
          allergies?: string[] | null
          breed?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          notes?: string | null
          photo?: string
          size?: string
          type?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_config: {
        Row: {
          created_at: string
          id: string
          vapid_private_key: string
          vapid_public_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          vapid_private_key: string
          vapid_public_key: string
        }
        Update: {
          created_at?: string
          id?: string
          vapid_private_key?: string
          vapid_public_key?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          description_en: string
          description_it: string
          duration_minutes: number
          icon: string
          id: string
          name: string
          name_en: string
          name_it: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          description_en?: string
          description_it?: string
          duration_minutes?: number
          icon?: string
          id?: string
          name: string
          name_en?: string
          name_it?: string
          price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          description_en?: string
          description_it?: string
          duration_minutes?: number
          icon?: string
          id?: string
          name?: string
          name_en?: string
          name_it?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string
          allow_cash: boolean
          allow_online: boolean
          business_name: string
          cancellation_policy: string
          email: string
          facebook_url: string
          id: string
          instagram_url: string
          phone: string
          privacy_policy: string
          tagline: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          address?: string
          allow_cash?: boolean
          allow_online?: boolean
          business_name?: string
          cancellation_policy?: string
          email?: string
          facebook_url?: string
          id?: string
          instagram_url?: string
          phone?: string
          privacy_policy?: string
          tagline?: string
          theme_color?: string
          updated_at?: string
        }
        Update: {
          address?: string
          allow_cash?: boolean
          allow_online?: boolean
          business_name?: string
          cancellation_policy?: string
          email?: string
          facebook_url?: string
          id?: string
          instagram_url?: string
          phone?: string
          privacy_policy?: string
          tagline?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      book_appointment:
        | {
            Args: {
              p_animal_type: string
              p_breed: string
              p_date: string
              p_duration_minutes: number
              p_notes?: string
              p_price: number
              p_service_id: string
              p_service_name: string
              p_size: string
              p_time: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_animal_type: string
              p_breed: string
              p_date: string
              p_duration_minutes: number
              p_notes?: string
              p_payment_method?: string
              p_price: number
              p_service_id: string
              p_service_name: string
              p_size: string
              p_time: string
              p_user_id: string
            }
            Returns: string
          }
      get_admin_user_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_message_participant: {
        Args: { _message_id: string; _user_id: string }
        Returns: boolean
      }
      mark_my_messages_as_read: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
