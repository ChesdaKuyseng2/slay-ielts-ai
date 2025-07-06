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
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ai_generated_tests: {
        Row: {
          content: Json
          created_at: string
          difficulty_level: string | null
          id: string
          is_active: boolean | null
          skill_type: string
          topic: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          skill_type: string
          topic?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          difficulty_level?: string | null
          id?: string
          is_active?: boolean | null
          skill_type?: string
          topic?: string | null
        }
        Relationships: []
      }
      ai_test_sessions: {
        Row: {
          ai_feedback: Json | null
          band_scores: Json | null
          completed_at: string | null
          created_at: string
          id: string
          overall_band_score: number | null
          skill_type: string
          started_at: string | null
          test_id: string | null
          time_spent: number | null
          user_id: string
          user_responses: Json | null
        }
        Insert: {
          ai_feedback?: Json | null
          band_scores?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_band_score?: number | null
          skill_type: string
          started_at?: string | null
          test_id?: string | null
          time_spent?: number | null
          user_id: string
          user_responses?: Json | null
        }
        Update: {
          ai_feedback?: Json | null
          band_scores?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          overall_band_score?: number | null
          skill_type?: string
          started_at?: string | null
          test_id?: string | null
          time_spent?: number | null
          user_id?: string
          user_responses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_test_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          skill_type: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          skill_type?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          skill_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          ai_feedback: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          score: number | null
          session_data: Json | null
          skill_type: string
          user_id: string | null
        }
        Insert: {
          ai_feedback?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          session_data?: Json | null
          skill_type: string
          user_id?: string | null
        }
        Update: {
          ai_feedback?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          session_data?: Json | null
          skill_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      test_history: {
        Row: {
          completed: boolean | null
          created_at: string
          feedback: Json | null
          id: string
          scores: Json | null
          session_id: string | null
          skill_type: string
          test_content: Json | null
          test_type: string
          time_spent: number | null
          updated_at: string
          user_id: string
          user_responses: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          feedback?: Json | null
          id?: string
          scores?: Json | null
          session_id?: string | null
          skill_type: string
          test_content?: Json | null
          test_type: string
          time_spent?: number | null
          updated_at?: string
          user_id: string
          user_responses?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          feedback?: Json | null
          id?: string
          scores?: Json | null
          session_id?: string | null
          skill_type?: string
          test_content?: Json | null
          test_type?: string
          time_spent?: number | null
          updated_at?: string
          user_id?: string
          user_responses?: Json | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          average_score: number | null
          best_score: number | null
          created_at: string
          id: string
          last_test_date: string | null
          skill_type: string
          streak_days: number | null
          total_tests: number | null
          total_time_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string
          id?: string
          last_test_date?: string | null
          skill_type: string
          streak_days?: number | null
          total_tests?: number | null
          total_time_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string
          id?: string
          last_test_date?: string | null
          skill_type?: string
          streak_days?: number | null
          total_tests?: number | null
          total_time_spent?: number | null
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
      insert_test_history: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_test_type: string
          p_skill_type: string
          p_test_content: Json
        }
        Returns: undefined
      }
      update_test_history: {
        Args: {
          p_session_id: string
          p_user_responses: Json
          p_scores: Json
          p_feedback: Json
          p_time_spent: number
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
    Enums: {},
  },
} as const
