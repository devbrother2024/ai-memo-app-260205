export interface Database {
  public: {
    Tables: {
      memos: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          tags: string[]
          summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          tags?: string[]
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[]
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// DB Row를 Memo 인터페이스로 변환
export type MemoRow = Database['public']['Tables']['memos']['Row']
export type MemoInsert = Database['public']['Tables']['memos']['Insert']
export type MemoUpdate = Database['public']['Tables']['memos']['Update']
