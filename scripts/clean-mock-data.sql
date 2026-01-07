-- ============================================
-- CueMe Database Cleanup Script
-- Date: 2025-01-06
-- Purpose: Backup and delete mock data before File Search migration
-- ============================================

-- Step 1: Create backup tables with timestamp
CREATE TABLE IF NOT EXISTS qna_items_backup_20250106 AS
SELECT * FROM qna_items;

CREATE TABLE IF NOT EXISTS qna_collections_backup_20250106 AS
SELECT * FROM qna_collections;

CREATE TABLE IF NOT EXISTS documents_backup_20250106 AS
SELECT * FROM documents;

CREATE TABLE IF NOT EXISTS document_chunks_backup_20250106 AS
SELECT * FROM document_chunks;

CREATE TABLE IF NOT EXISTS processing_jobs_backup_20250106 AS
SELECT * FROM processing_jobs;

-- Step 2: Display backup counts for verification
SELECT
  'qna_items' as backup_table,
  COUNT(*) as backed_up_rows
FROM qna_items_backup_20250106
UNION ALL
SELECT 'qna_collections', COUNT(*) FROM qna_collections_backup_20250106
UNION ALL
SELECT 'documents', COUNT(*) FROM documents_backup_20250106
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks_backup_20250106
UNION ALL
SELECT 'processing_jobs', COUNT(*) FROM processing_jobs_backup_20250106;

-- Step 3: Delete mock data (respecting foreign key constraints - delete children first)
DELETE FROM document_chunks;
DELETE FROM processing_jobs;
DELETE FROM qna_items;
DELETE FROM documents;
DELETE FROM qna_collections;

-- Step 4: Verify deletion (should all return 0)
SELECT
  'qna_items' as table_name,
  COUNT(*) as remaining_rows
FROM qna_items
UNION ALL
SELECT 'qna_collections', COUNT(*) FROM qna_collections
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'document_chunks', COUNT(*) FROM document_chunks
UNION ALL
SELECT 'processing_jobs', COUNT(*) FROM processing_jobs;

-- Step 5: Reset sequences (optional - keeps IDs starting fresh)
-- Uncomment if you want to reset ID sequences
-- ALTER SEQUENCE qna_collections_id_seq RESTART WITH 1;
-- ALTER SEQUENCE qna_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE documents_id_seq RESTART WITH 1;

-- Success message
SELECT '✓ Mock data cleanup completed successfully' as status;
