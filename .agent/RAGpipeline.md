CueMe RAG Pipeline Architecture
This document outlines the architecture and data flow for the Retrieval Augmented Generation (RAG) system in CueMe, utilizing Gemini File Search.

1. System Overview
The RAG pipeline enables CueMeFinal (Electron App) to retrieve relevant information from user uploaded documents via CueMeWeb (Next.js API) which interfaces with Google's Gemini File Search.

Key Components
Component	Responsibility
CueMeFinal	Client app using 
LLMHelper
 & 
DocumentService
 to request RAG context
CueMeWeb	Intermediary API handling auth, rate limits, and Gemini integration
Gemini File Search	External service handling indexing, vector search, and context retrieval
Supabase	Authenticates users and stores metadata maps (user_file_search_files)
2. Data Flow
A. Document Upload Flow (Indexing)
User Action: User uploads a file (PDF, TXT, etc.) in CueMeWeb dashboard.
Frontend: 
DocumentUpload.tsx
 validates file and POSTs to /api/documents/upload-filesearch.
API Route:
Authenticates user via Supabase.
Checks usage limits.
Calls GeminiFileSearchService.uploadDocument().
Gemini Service:
Creates/Gets user-specific store (fileSearchStores/cueme_user_XXX).
Uploads file to Gemini (returns LRO - Long Running Operation).
Synchronously polls operation until completion (waits for indexing).
Returns final file name.
Database: Inserts record into user_file_search_files with status: 'completed'.
Response: Returns success to frontend; UI shows "Ready".
B. Query Flow (Retrieval)
User Action: User asks a question in CueMeFinal.
Client Logic:
LLMHelper.searchRAGContext() calls DocumentService.findRelevantChunks().
DocumentService
 POSTs query to https://www.cueme.ink/api/documents/query-filesearch.
API Route:
Authenticates user.
Verifies collection ownership & uses_file_search flag.
Calls GeminiFileSearchService.queryDocuments().
Gemini Integration:
Selects user's File Search store.
Executes gemini-2.5-flash model with fileSearch tool.
Gemini retrieves relevant chunks and generates a grounded answer.
Response: Returns text answer + citations to CueMeFinal.
Integration: 
LLMHelper
 combines RAG answer with QnA results for final LLM prompt.
3. Key Database Tables (Supabase)
user_file_search_stores
Maps Supabase User IDs to Gemini Store IDs.

user_id: UUID
store_name: fileSearchStores/cueme_user_...
user_file_search_files
Tracks status of files within Gemini stores.

file_search_file_name: Actual Gemini file resource name
status: indexing | completed | failed
collection_id: Logical grouping for CueMe
4. API Endpoints
POST /api/documents/upload-filesearch
Auth: Bearer Token
Body: Multipart form (file, collectionId)
Timeout: 60s (configured in 
vercel.json
 to allow sync polling)
POST /api/documents/query-filesearch
Auth: Bearer Token
Body: { query: string, collectionId: string }
Response: { answer: string, citations: string[] }
5. Deployment Considerations
Vercel Functions: Upload endpoint requires extended timeout (maxDuration: 60) because it waits for Gemini indexing.
Environment Vars: Requires GEMINI_API_KEY with File Search permissions.
Production URL: Electron app points to https://www.cueme.ink.
6. Known Constraints
File Size: Max 100MB per file.
Polling: Upload waits synchronously; if Gemini takes >60s, it may timeout (client retry required).
Latency: First query might be slower due to cold start of File Search store.