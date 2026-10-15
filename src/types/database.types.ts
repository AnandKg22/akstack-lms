export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "instructor" | "student";

export interface Database {
  public: {
    Tables: {
      app_akstack_lms_courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          price_cents: number;
          currency: string;
          thumbnail_url: string | null;
          is_published: boolean;
          community_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          thumbnail_url?: string | null;
          is_published?: boolean;
          community_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          thumbnail_url?: string | null;
          is_published?: boolean;
          community_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_akstack_lms_modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_akstack_lms_lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          slug: string;
          content: string | null;
          order_index: number;
          is_preview: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          slug: string;
          content?: string | null;
          order_index: number;
          is_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          order_index?: number;
          is_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_akstack_lms_course_enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          payment_provider: string;
          transaction_id: string | null;
          status: "active" | "revoked" | "refunded";
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          payment_provider?: string;
          transaction_id?: string | null;
          status?: "active" | "revoked" | "refunded";
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          payment_provider?: string;
          transaction_id?: string | null;
          status?: "active" | "revoked" | "refunded";
          enrolled_at?: string;
        };
      };
      app_akstack_lms_lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          is_completed: boolean;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          is_completed?: boolean;
          last_accessed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          course_id?: string;
          is_completed?: boolean;
          last_accessed_at?: string;
        };
      };
    };
    Functions: {
      app_akstack_lms_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      app_akstack_lms_has_course_access: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
    };
  };
}

// Convenience View Types
export type Course = Database["public"]["Tables"]["app_akstack_lms_courses"]["Row"];
export type Module = Database["public"]["Tables"]["app_akstack_lms_modules"]["Row"];
export type Lesson = Database["public"]["Tables"]["app_akstack_lms_lessons"]["Row"];
export type CourseEnrollment = Database["public"]["Tables"]["app_akstack_lms_course_enrollments"]["Row"];
export type LessonProgress = Database["public"]["Tables"]["app_akstack_lms_lesson_progress"]["Row"];

export type ModuleWithLessons = Module & {
  lessons: Lesson[];
};

export type CourseWithHierarchy = Course & {
  modules: ModuleWithLessons[];
};
