-- ============================================
-- CueMe File Search Migration
-- Date: 2025-01-06
-- Purpose: Add File Search tables and user isolation infrastructure
-- ============================================

-- ============================================
-- Part 1: Create User File Search Store Mapping Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_file_search_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL UNIQUE,        -- e.g., "cueme_user_abc12345"
  store_id TEXT NOT NULL,                  -- Gemini's internal store ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_file_search_stores_user_id_unique UNIQUE(user_id)  -- One store per user
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_file_search_stores_user_id
  ON user_file_search_stores(user_id);

-- Index for store name lookup
CREATE INDEX IF NOT EXISTS idx_user_file_search_stores_store_name
  ON user_file_search_stores(store_name);

-- Enable RLS
ALTER TABLE user_file_search_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own store
CREATE POLICY "Users can only access own file search store"
  ON user_file_search_stores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE user_file_search_stores IS
'Maps users to their dedicated Gemini File Search stores for data isolation. Each user gets one store.';

-- ============================================
-- Part 2: Create File Tracking Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_file_search_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES qna_collections(id) ON DELETE CASCADE,
  file_search_store_id UUID NOT NULL REFERENCES user_file_search_stores(id) ON DELETE CASCADE,
  file_search_file_name TEXT NOT NULL,    -- Gemini's file identifier
  display_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'indexing' CHECK (status IN ('indexing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_file_search_files_file_name_unique UNIQUE(file_search_file_name)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_file_search_files_user_id
  ON user_file_search_files(user_id);

CREATE INDEX IF NOT EXISTS idx_user_file_search_files_collection_id
  ON user_file_search_files(collection_id);

CREATE INDEX IF NOT EXISTS idx_user_file_search_files_store_id
  ON user_file_search_files(file_search_store_id);

CREATE INDEX IF NOT EXISTS idx_user_file_search_files_status
  ON user_file_search_files(status);

-- Enable RLS
ALTER TABLE user_file_search_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own files
CREATE POLICY "Users can only access own files"
  ON user_file_search_files
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE user_file_search_files IS
'Tracks files uploaded to Gemini File Search stores. Links files to collections and provides metadata.';

-- ============================================
-- Part 3: Alter Existing Tables
-- ============================================

-- Add File Search support to collections
ALTER TABLE qna_collections
  ADD COLUMN IF NOT EXISTS uses_file_search BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_search_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN qna_collections.uses_file_search IS
'Indicates if this collection has documents in File Search';

COMMENT ON COLUMN qna_collections.file_search_enabled IS
'Toggle to enable/disable File Search for this collection';

-- Add File Search reference to documents (for backward compatibility)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS file_search_file_id UUID REFERENCES user_file_search_files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'legacy' CHECK (migration_status IN ('legacy', 'migrated', 'file_search_native'));

COMMENT ON COLUMN documents.file_search_file_id IS
'Link to new file_search_files table for migrated documents';

COMMENT ON COLUMN documents.migration_status IS
'Tracks migration status: legacy (old system), migrated (moved to File Search), file_search_native (created after migration)';

-- ============================================
-- Part 4: Create Updated Timestamp Trigger
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_file_search_stores_updated_at
  BEFORE UPDATE ON user_file_search_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_file_search_files_updated_at
  BEFORE UPDATE ON user_file_search_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Part 5: Deprecation Comments
-- ============================================

COMMENT ON TABLE document_chunks IS
'DEPRECATED (2025-01-06): File Search handles chunking internally. Safe to drop after 2026-02-01. Kept for rollback safety.';

COMMENT ON TABLE processing_jobs IS
'DEPRECATED (2025-01-06): File Search handles processing asynchronously. Safe to drop after 2026-02-01. Kept for rollback safety.';

-- ============================================
-- Part 6: Verification Queries
-- ============================================

-- Verify tables created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_file_search_stores', 'user_file_search_files')
ORDER BY table_name;

-- Verify RLS enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_file_search_stores', 'user_file_search_files')
ORDER BY tablename;

-- Verify indexes created
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_file_search_stores', 'user_file_search_files')
ORDER BY tablename, indexname;

-- Success message
SELECT '✓ File Search schema migration completed successfully' as status,
       'Created: user_file_search_stores, user_file_search_files' as tables,
       'Updated: qna_collections, documents' as modified_tables;
