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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
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