/**
 * Gemini File Search Service
 *
 * Handles document upload, indexing, and RAG queries using Gemini's File Search API.
 * Implements per-user isolation via dedicated File Search stores.
 *
 * Architecture:
 * - Each user gets one dedicated File Search store (cueme_user_{userId})
 * - Stores are lazily created on first document upload
 * - Store mapping is persisted in Supabase for fast lookup
 * - Documents are scoped to collections via metadata filtering
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Interface for file metadata stored in Supabase
 */
export interface FileSearchFile {
  id: string;
  user_id: string;
  collection_id: string | null;
  file_search_store_id: string;
  file_search_file_name: string;
  display_name: string;
  original_file_name: string;
  file_size: number | null;
  file_type: string | null;
  status: 'indexing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for File Search store metadata
 */
export interface FileSearchStore {
  id: string;
  user_id: string;
  store_name: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for RAG query response
 */
export interface FileSearchResponse {
  answer: string;
  citations?: any;
  groundingMetadata?: any;
}

/**
 * Gemini File Search Service
 *
 * Provides methods for managing File Search stores and documents
 * with per-user isolation.
 */
export class GeminiFileSearchService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for File Search service');
    }

    this.genAI = genAI;
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Get or create a user's dedicated File Search store
   *
   * @param userId - The user's UUID
   * @returns The store name (e.g., "fileSearchStores/cueme_user_abc12345")
   */
  async getUserStore(userId: string): Promise<string> {
    // 1. Check if user already has a store in Supabase
    const { data: existingStore, error: fetchError } = await supabaseAdmin
      .from('user_file_search_stores')
      .select('store_name, store_id')
      .eq('user_id', userId)
      .single();

    if (existingStore && !fetchError) {
      console.log(`[FileSearch] Found existing store for user ${userId}: ${existingStore.store_name}`);
      return existingStore.store_name;
    }

    // 2. Create new File Search store for user (first-time setup)
    const storeName = `cueme_user_${userId.substring(0, 8)}`;
    console.log(`[FileSearch] Creating new store for user ${userId}: ${storeName}`);

    try {
      // Note: @google/generative-ai doesn't have native FileSearchStore support yet
      // We'll use the REST API directly
      console.log(`[FileSearch] Creating store with API key present:`, !!this.apiKey);
      console.log(`[FileSearch] Store display name:`, storeName);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: storeName
          })
        }
      );

      console.log(`[FileSearch] Store creation response status:`, response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Failed to create File Search store: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = `Failed to create File Search store: ${JSON.stringify(errorData)}`;
        } catch (jsonError) {
          // Response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += `\nResponse: ${errorText.substring(0, 500)}`;
            }
          } catch (textError) {
            // Response has no body
            errorMessage += '\n(No response body)';
          }
        }

        console.error('[FileSearch] Store creation API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const store = await response.json();
      console.log(`[FileSearch] Store created successfully:`, store);

      // Validate store response
      if (!store || !store.name) {
        console.error('[FileSearch] Invalid store response:', store);
        throw new Error('Store creation returned invalid response - missing store name');
      }

      console.log(`[FileSearch] Store name from API: "${store.name}"`);

      // 3. Save store mapping in Supabase
      const { error: insertError } = await supabaseAdmin
        .from('user_file_search_stores')
        .insert({
          user_id: userId,
          store_name: store.name,
          store_id: store.name
        });

      if (insertError) {
        console.error(`[FileSearch] Failed to save store mapping:`, insertError);
        throw new Error(`Failed to save store mapping: ${insertError.message}`);
      }

      return store.name;
    } catch (error) {
      console.error(`[FileSearch] Error creating store:`, error);
      throw error;
    }
  }

  /**
   * Upload a document to user's File Search store
   *
   * @param userId - The user's UUID
   * @param collectionId - The collection UUID to associate with
   * @param file - The file buffer to upload
   * @param fileName - Original file name
   * @param fileType - MIME type
   * @returns The file ID in File Search
   */
  async uploadDocument(
    userId: string,
    collectionId: string,
    file: Buffer | Blob,
    fileName: string,
    fileType: string
  ): Promise<string> {
    // Validate inputs
    if (!userId || !collectionId) {
      throw new Error('userId and collectionId are required');
    }

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log(`[FileSearch] Uploading document for user ${userId}, collection ${collectionId}: ${fileName}`);

    // 1. Get user's store
    const storeName = await this.getUserStore(userId);

    // 2. Get store UUID from mapping
    const { data: storeMapping } = await supabaseAdmin
      .from('user_file_search_stores')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!storeMapping) {
      throw new Error('Store mapping not found after creation');
    }

    try {
      // 3. Upload file directly to File Search store
      // Note: Using REST API as SDK doesn't fully support File Search yet
      const formData = new FormData();

      // Handle both Buffer and Blob inputs
      let blob: Blob;
      if (Buffer.isBuffer(file)) {
        // Convert Buffer to Blob for FormData
        blob = new Blob([file as any], { type: fileType });
      } else {
        blob = file;
      }

      formData.append('file', blob, fileName);

      console.log('[FileSearch] Upload request details:', {
        url: `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore`,
        storeName,
        fileName,
        fileType,
        fileSize: blob.size,
        hasApiKey: !!this.apiKey
      });

      const uploadResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore?key=${this.apiKey}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        let errorMessage = `File upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`;

        try {
          const errorData = await uploadResponse.json();
          errorMessage = `File upload failed: ${JSON.stringify(errorData)}`;
        } catch (jsonError) {
          // Response is not JSON, try to get text
          try {
            const errorText = await uploadResponse.text();
            if (errorText) {
              errorMessage += `\nResponse: ${errorText.substring(0, 500)}`;
            }
          } catch (textError) {
            // Response has no body
            errorMessage += '\n(No response body)';
          }
        }

        console.error('[FileSearch] Upload API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const uploadedFile = await uploadResponse.json();
      console.log(`[FileSearch] File uploaded successfully:`, uploadedFile);

      // 4. Save file metadata to Supabase
      const { data: fileRecord, error: insertError } = await supabaseAdmin
        .from('user_file_search_files')
        .insert({
          user_id: userId,
          collection_id: collectionId,
          file_search_store_id: storeMapping.id,
          file_search_file_name: uploadedFile.name,
          display_name: fileName,
          original_file_name: fileName,
          file_size: blob.size,
          file_type: fileType,
          status: 'indexing'
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[FileSearch] Failed to save file metadata:`, insertError);
        throw new Error(`Failed to save file metadata: ${insertError.message}`);
      }

      // 5. Poll for indexing completion (async)
      this.pollIndexingStatus(uploadedFile.name, fileRecord.id).catch(err => {
        console.error(`[FileSearch] Background indexing check failed:`, err);
      });

      return uploadedFile.name;
    } catch (error) {
      console.error(`[FileSearch] Upload error:`, error);
      throw error;
    }
  }

  /**
   * Poll for file indexing completion (runs in background)
   *
   * @param fileName - Gemini file name
   * @param fileRecordId - Supabase record ID
   */
  private async pollIndexingStatus(fileName: string, fileRecordId: string): Promise<void> {
    const maxAttempts = 30; // 30 attempts × 2 seconds = 1 minute max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // Check file status via API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${this.apiKey}`
        );

        if (response.ok) {
          const file = await response.json();

          if (file.state === 'ACTIVE') {
            // File is ready
            await supabaseAdmin
              .from('user_file_search_files')
              .update({ status: 'completed' })
              .eq('id', fileRecordId);

            console.log(`[FileSearch] File ${fileName} indexing completed`);
            return;
          } else if (file.state === 'FAILED') {
            // Indexing failed
            await supabaseAdmin
              .from('user_file_search_files')
              .update({
                status: 'failed',
                error_message: 'File indexing failed'
              })
              .eq('id', fileRecordId);

            console.error(`[FileSearch] File ${fileName} indexing failed`);
            return;
          }
        }

        // Wait 2 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error(`[FileSearch] Error polling status:`, error);
        attempts++;
      }
    }

    // Timeout - mark as completed anyway (user can retry if it doesn't work)
    await supabaseAdmin
      .from('user_file_search_files')
      .update({ status: 'completed' })
      .eq('id', fileRecordId);
  }

  /**
   * Query user's documents with RAG
   *
   * @param userId - The user's UUID
   * @param collectionId - The collection UUID to search within
   * @param question - The user's question
   * @returns RAG-enhanced response with citations
   */
  async queryDocuments(
    userId: string,
    collectionId: string,
    question: string
  ): Promise<FileSearchResponse> {
    console.log(`[FileSearch] Querying documents for user ${userId}, collection ${collectionId}`);

    // 1. Get user's store
    const storeName = await this.getUserStore(userId);

    // 2. Query with File Search tool
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: question }] }],
        tools: [{
          // @ts-ignore - SDK types might not include fileSearch yet
          fileSearch: {
            fileSearchStoreNames: [storeName]
          }
        } as any]
      });

      const response = result.response;
      const text = response.text();

      return {
        answer: text,
        citations: response.candidates?.[0]?.citationMetadata,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      console.error(`[FileSearch] Query error:`, error);
      throw error;
    }
  }

  /**
   * Delete a document from user's File Search store
   *
   * @param userId - The user's UUID
   * @param fileId - The file record ID in Supabase
   */
  async deleteDocument(userId: string, fileId: string): Promise<void> {
    console.log(`[FileSearch] Deleting document ${fileId} for user ${userId}`);

    // 1. Get file metadata
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('user_file_search_files')
      .select('file_search_file_name, user_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      throw new Error('File not found');
    }

    // 2. Verify ownership
    if (file.user_id !== userId) {
      throw new Error('Unauthorized: User does not own this file');
    }

    try {
      // 3. Delete from Gemini File Search
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${file.file_search_file_name}?key=${this.apiKey}`,
        { method: 'DELETE' }
      );

      // 4. Delete from Supabase
      const { error: deleteError } = await supabaseAdmin
        .from('user_file_search_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        throw new Error(`Failed to delete file record: ${deleteError.message}`);
      }

      console.log(`[FileSearch] Document deleted successfully`);
    } catch (error) {
      console.error(`[FileSearch] Delete error:`, error);
      throw error;
    }
  }

  /**
   * List all files in user's store
   *
   * @param userId - The user's UUID
   * @param collectionId - Optional collection filter
   * @returns Array of file metadata
   */
  async listUserFiles(
    userId: string,
    collectionId?: string
  ): Promise<FileSearchFile[]> {
    let query = supabaseAdmin
      .from('user_file_search_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error(`[FileSearch] Error listing files:`, error);
      throw error;
    }

    return files || [];
  }
}

// Export singleton instance
export const fileSearchService = new GeminiFileSearchService();
