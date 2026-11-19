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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      academic_requests: {
        Row: {
          course_id: number | null
          details: string
          id: number
          request_type: string
          status: string
          subject: string
          submitted_date: string
          user_id: number
        }
        Insert: {
          course_id?: number | null
          details: string
          id?: number
          request_type: string
          status?: string
          subject: string
          submitted_date: string
          user_id: number
        }
        Update: {
          course_id?: number | null
          details?: string
          id?: number
          request_type?: string
          status?: string
          subject?: string
          submitted_date?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: number
          created_at: string | null
          due_date: string
          due_time: string
          id: number
          notes: string
          priority: string
          score_percent: number | null
          status: string
          title: string
          user_id: number
          weight_percent: number
        }
        Insert: {
          course_id: number
          created_at?: string | null
          due_date: string
          due_time?: string
          id?: number
          notes?: string
          priority?: string
          score_percent?: number | null
          status?: string
          title: string
          user_id: number
          weight_percent?: number
        }
        Update: {
          course_id?: number
          created_at?: string | null
          due_date?: string
          due_time?: string
          id?: number
          notes?: string
          priority?: string
          score_percent?: number | null
          status?: string
          title?: string
          user_id?: number
          weight_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          attended_classes: number
          code: string
          color: string
          created_at: string | null
          credits: number
          grade_percent: number
          id: number
          instructor: string
          semester: string
          title: string
          total_classes: number
          user_id: number
        }
        Insert: {
          attended_classes?: number
          code: string
          color?: string
          created_at?: string | null
          credits?: number
          grade_percent?: number
          id?: number
          instructor: string
          semester?: string
          title: string
          total_classes?: number
          user_id: number
        }
        Update: {
          attended_classes?: number
          code?: string
          color?: string
          created_at?: string | null
          credits?: number
          grade_percent?: number
          id?: number
          instructor?: string
          semester?: string
          title?: string
          total_classes?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed_at: string
          course_id: number | null
          created_at: string | null
          duration_minutes: number
          id: number
          label: string
          user_id: number
        }
        Insert: {
          completed_at: string
          course_id?: number | null
          created_at?: string | null
          duration_minutes: number
          id?: number
          label: string
          user_id: number
        }
        Update: {
          completed_at?: string
          course_id?: number | null
          created_at?: string | null
          duration_minutes?: number
          id?: number
          label?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_sessions: {
        Row: {
          course_id: number
          day_of_week: string
          end_time: string
          id: number
          location: string
          session_type: string
          start_time: string
          user_id: number
        }
        Insert: {
          course_id: number
          day_of_week: string
          end_time: string
          id?: number
          location: string
          session_type?: string
          start_time: string
          user_id: number
        }
        Update: {
          course_id?: number
          day_of_week?: string
          end_time?: string
          id?: number
          location?: string
          session_type?: string
          start_time?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "timetable_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          daily_focus_goal_minutes: number
          email: string
          id: number
          major: string
          name: string
          target_gpa: number
          term: string
          uid: string
        }
        Insert: {
          created_at?: string | null
          daily_focus_goal_minutes?: number
          email: string
          id?: number
          major?: string
          name?: string
          target_gpa?: number
          term?: string
          uid: string
        }
        Update: {
          created_at?: string | null
          daily_focus_goal_minutes?: number
          email?: string
          id?: number
          major?: string
          name?: string
          target_gpa?: number
          term?: string
          uid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
