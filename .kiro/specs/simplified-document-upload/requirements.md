# Requirements Document

## Introduction

This feature simplifies the document upload workflow by removing the complex Q&A generation system and replacing it with a straightforward document chunking and vectorization system. Users can upload documents that are automatically split into text chunks (maximum 30 chunks), vectorized for semantic search, and stored in the database. Users can also delete their uploaded documents and associated chunks.

## Requirements

### Requirement 1: Document Upload and Processing

**User Story:** As a user, I want to upload a document and have it automatically processed into searchable text chunks, so that I can quickly access and search through my document content without complex Q&A generation.

#### Acceptance Criteria

1. WHEN a user uploads a PDF, PNG, or JPEG file THEN the system SHALL accept files up to 15MB in size
2. WHEN a document is uploaded THEN the system SHALL extract text content using existing OCR/text extraction capabilities
3. WHEN text is extracted THEN the system SHALL split it into logical chunks of reasonable size (typically 200-500 words per chunk)
4. WHEN chunking is complete THEN the system SHALL limit the total number of chunks to a maximum of 30 chunks per document
5. IF a document would generate more than 30 chunks THEN the system SHALL merge smaller chunks or use larger chunk sizes to stay within the limit
6. WHEN chunks are created THEN the system SHALL generate vector embeddings for each chunk using the existing OpenAI embedding service
7. WHEN processing is complete THEN the system SHALL store the document metadata in the `documents` table and chunks in the `document_chunks` table
8. WHEN processing is complete THEN the system SHALL update the document status to 'completed' and display success message to user

### Requirement 2: Document Management and Deletion

**User Story:** As a user, I want to view and delete my uploaded documents, so that I can manage my document storage and remove files I no longer need.

#### Acceptance Criteria

1. WHEN a user views their documents THEN the system SHALL display a list of all their uploaded documents with file names, upload dates, and chunk counts
2. WHEN a user clicks delete on a document THEN the system SHALL prompt for confirmation before deletion
3. WHEN a user confirms deletion THEN the system SHALL remove the document record from the `documents` table
4. WHEN a document is deleted THEN the system SHALL automatically delete all associated chunks from the `document_chunks` table via foreign key cascade
5. WHEN a document is deleted THEN the system SHALL remove the associated file from Supabase storage
6. WHEN deletion is complete THEN the system SHALL update the document list to reflect the removal
7. WHEN deletion fails THEN the system SHALL display an appropriate error message and not remove the document from the list

### Requirement 3: Database Schema Alignment

**User Story:** As a developer, I want the document processing to use the existing `documents` and `document_chunks` tables, so that the system architecture is consistent and simplified.

#### Acceptance Criteria

1. WHEN a document is uploaded THEN the system SHALL create a record in the `documents` table with user_id, file_name, file_size, file_type, status, and display_name
2. WHEN chunks are created THEN the system SHALL store each chunk in the `document_chunks` table with document_id, chunk_text, chunk_order, and created_at
3. WHEN processing is complete THEN the system SHALL update the `chunk_count` field in the `documents` table with the actual number of chunks created
4. WHEN the system processes documents THEN it SHALL NOT use the `document_processing_sessions`, `qna_collections`, or `qna_items` tables
5. WHEN embeddings are generated THEN the system SHALL store them using the existing vector storage mechanism (if `document_chunks` table supports embeddings) or create a separate embeddings table if needed

### Requirement 4: User Interface Simplification

**User Story:** As a user, I want a simplified upload interface without complex processing options, so that I can quickly upload documents without configuration overhead.

#### Acceptance Criteria

1. WHEN a user accesses the upload interface THEN the system SHALL display a simple file drop zone and upload button
2. WHEN a user uploads a document THEN the system SHALL NOT display complex processing options (question types, segmentation strategies, etc.)
3. WHEN a document is processing THEN the system SHALL show a simple progress indicator with basic status messages
4. WHEN processing is complete THEN the system SHALL redirect the user to a document list view or display a success message with next steps
5. WHEN a user views their documents THEN the system SHALL display a clean list with file names, upload dates, chunk counts, and delete buttons

### Requirement 5: Performance and Limits

**User Story:** As a system administrator, I want the document processing to be efficient and respect usage limits, so that the system remains performant and cost-effective.

#### Acceptance Criteria

1. WHEN processing documents THEN the system SHALL complete processing within 2 minutes for typical documents
2. WHEN a user has reached their subscription limit for documents THEN the system SHALL prevent new uploads and display appropriate messaging
3. WHEN chunking documents THEN the system SHALL optimize chunk boundaries to preserve sentence and paragraph integrity where possible
4. WHEN generating embeddings THEN the system SHALL batch process chunks efficiently to minimize API calls
5. WHEN storing chunks THEN the system SHALL include proper indexing for efficient retrieval and search operations