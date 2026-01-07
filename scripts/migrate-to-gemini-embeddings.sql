-- ============================================
-- Gemini Embeddings Migration
-- Date: 2026-01-06
-- Purpose: Migrate from OpenAI (1536 dims) to Gemini (768 dims) embeddings
-- ============================================

-- IMPORTANT: This migration will drop all existing embeddings
-- Make sure to backup data before running if needed

-- ============================================
-- Part 1: Update qna_items Table
-- ============================================

-- Drop existing embedding column and index
DROP INDEX IF EXISTS qna_items_embedding_idx;
ALTER TABLE qna_items DROP COLUMN IF EXISTS embedding;

-- Add new embedding column with 768 dimensions (Gemini text-embedding-004)
ALTER TABLE qna_items ADD COLUMN embedding vector(768);

-- Create new vector index with 768 dimensions
CREATE INDEX qna_items_embedding_idx ON qna_items
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON COLUMN qna_items.embedding IS
'Gemini text-embedding-004 vector (768 dimensions). Migrated from OpenAI text-embedding-3-large (1536 dims) on 2026-01-06';

-- ============================================
-- Part 2: Update RPC Functions for Q&A Search
-- ============================================

-- Drop old search function
DROP FUNCTION IF EXISTS search_qna_items(vector, uuid, float, int);

-- Create updated search function with 768 dimensions
CREATE OR REPLACE FUNCTION search_qna_items(
  query_embedding vector(768),  -- Changed from 1536
  collection_id_filter uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qi.id,
    qi.question,
    qi.answer,
    qi.tags,
    1 - (qi.embedding <=> query_embedding) as similarity
  FROM qna_items qi
  WHERE qi.collection_id = collection_id_filter
    AND qi.embedding IS NOT NULL
    AND 1 - (qi.embedding <=> query_embedding) >= match_threshold
  ORDER BY qi.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_qna_items IS
'Search Q&A items using Gemini embeddings (768 dimensions). Updated for Gemini text-embedding-004 on 2026-01-06';

-- ============================================
-- Part 3: Verification
-- ============================================

-- Verify column type
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'qna_items'
  AND column_name = 'embedding';

-- Verify index exists
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'qna_items'
  AND indexname = 'qna_items_embedding_idx';

-- Count items without embeddings (should be all after migration)
SELECT COUNT(*) as items_needing_embeddings
FROM qna_items
WHERE embedding IS NULL;

-- Success message
SELECT '✓ Gemini embeddings migration completed successfully' as status,
       '768 dimensions (Gemini text-embedding-004)' as embedding_model,
       'All existing embeddings cleared - will be regenerated on next query' as note;
