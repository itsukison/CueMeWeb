-- ============================================
-- Document RAG Migration: Gemini File Search → Supabase pgvector
-- Date: 2026-01-07
-- Purpose: Replace unreliable Gemini File Search with local pgvector embeddings
-- ============================================

-- IMPORTANT: This will drop all Gemini File Search tables since existing docs are mock data

-- ============================================
-- Part 1: Drop Deprecated Gemini File Search Tables
-- ============================================

-- Drop tables in correct order (respect foreign key constraints)
DROP TABLE IF EXISTS user_file_search_files CASCADE;
DROP TABLE IF EXISTS user_file_search_stores CASCADE;

-- Remove File Search columns from other tables
ALTER TABLE qna_collections DROP COLUMN IF EXISTS uses_file_search;
ALTER TABLE qna_collections DROP COLUMN IF EXISTS file_search_enabled;

-- Drop deprecated tables mentioned in comments
DROP TABLE IF EXISTS document_chunks CASCADE;  -- Old chunking table
DROP TABLE IF EXISTS processing_jobs CASCADE;   -- Old processing table

-- ============================================
-- Part 2: Create New document_chunks Table with pgvector
-- ============================================

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,  -- Will link to documents table
  collection_id UUID NOT NULL REFERENCES qna_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),  -- Gemini text-embedding-004 dimensions
  char_start INTEGER,     -- Start position in original document
  char_end INTEGER,       -- End position in original document
  metadata JSONB DEFAULT '{}',  -- Additional chunk metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

-- ============================================
-- Part 3: Create Indexes
-- ============================================

-- Foreign key indexes
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_collection_id ON document_chunks(collection_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);

-- Vector index for similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- Part 4: Enable Row Level Security
-- ============================================

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own chunks
CREATE POLICY "Users can only access own chunks"
  ON document_chunks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Part 5: Create Vector Search Function
-- ============================================

DROP FUNCTION IF EXISTS search_document_chunks(vector, uuid, float, int);

CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(768),
  collection_id_filter UUID,
  match_threshold FLOAT DEFAULT 0.6,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  char_start INTEGER,
  char_end INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.char_start,
    dc.char_end,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.collection_id = collection_id_filter
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) >= match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_document_chunks IS
'Search document chunks using Gemini text-embedding-004 (768 dimensions). 
Returns chunks sorted by similarity score.';

-- ============================================
-- Part 6: Update/Create documents Table
-- ============================================

-- Ensure documents table exists with correct structure
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES qna_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  full_text TEXT,  -- Store full extracted text for reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_collection_id ON documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own documents" ON documents;
CREATE POLICY "Users can only access own documents"
  ON documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update trigger for documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key from document_chunks to documents
ALTER TABLE document_chunks 
ADD CONSTRAINT fk_document_chunks_document 
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- ============================================
-- Part 7: Verification
-- ============================================

-- Verify tables created
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('document_chunks', 'documents')
ORDER BY table_name;

-- Verify document_chunks columns
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'document_chunks'
ORDER BY ordinal_position;

-- Verify RLS enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('document_chunks', 'documents');

-- Success message
SELECT '✓ Document RAG migration completed successfully' as status,
       'Dropped: user_file_search_stores, user_file_search_files' as dropped_tables,
       'Created: document_chunks (pgvector), documents' as created_tables,
       'Created: search_document_chunks function' as created_functions;
