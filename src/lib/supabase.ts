import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      qna_collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          source_document_id: string | null
          document_metadata: Record<string, unknown>
          processing_stats: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          source_document_id?: string | null
          document_metadata?: Record<string, unknown>
          processing_stats?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          source_document_id?: string | null
          document_metadata?: Record<string, unknown>
          processing_stats?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      qna_items: {
        Row: {
          id: string
          collection_id: string
          question: string
          answer: string
          tags: string[] | null
          embedding: number[] | null
          source_segment: string | null
          quality_score: number | null
          question_type: string | null
          review_status: 'pending' | 'approved' | 'rejected' | 'edited'
          original_question: string | null
          original_answer: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          question: string
          answer: string
          tags?: string[] | null
          embedding?: number[] | null
          source_segment?: string | null
          quality_score?: number | null
          question_type?: string | null
          review_status?: 'pending' | 'approved' | 'rejected' | 'edited'
          original_question?: string | null
          original_answer?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          question?: string
          answer?: string
          tags?: string[] | null
          embedding?: number[] | null
          source_segment?: string | null
          quality_score?: number | null
          question_type?: string | null
          review_status?: 'pending' | 'approved' | 'rejected' | 'edited'
          original_question?: string | null
          original_answer?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_jpy: number
          max_files: number
          max_qnas_per_file: number
          max_monthly_questions: number
          stripe_price_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price_jpy?: number
          max_files: number
          max_qnas_per_file: number
          max_monthly_questions: number
          stripe_price_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_jpy?: number
          max_files?: number
          max_qnas_per_file?: number
          max_monthly_questions?: number
          stripe_price_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month_year: string
          questions_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          questions_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          questions_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      document_processing_sessions: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress: number
          current_step: string | null
          processing_options: Record<string, unknown>
          error_message: string | null
          collection_id: string | null
          processing_stats: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          current_step?: string | null
          processing_options?: Record<string, unknown>
          error_message?: string | null
          collection_id?: string | null
          processing_stats?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          progress?: number
          current_step?: string | null
          processing_options?: Record<string, unknown>
          error_message?: string | null
          collection_id?: string | null
          processing_stats?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      search_qna_items: {
        Args: {
          query_embedding: number[]
          collection_id_filter: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          question: string
          answer: string
          tags: string[]
          similarity: number
        }[]
      }
    }
  }
}