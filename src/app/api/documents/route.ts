/**
 * Documents API (File Search Version)
 *
 * Handles document listing and deletion with Gemini File Search.
 * This replaces the old documents table with user_file_search_files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { fileSearchService } from '@/lib/gemini-file-search';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function decrementDocumentUsage(userId: string): Promise<void> {
  try {
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Get current usage
    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_document_scans_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();

    if (usage && usage.total_document_scans_used > 0) {
      // Decrement usage count
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_document_scans_used: usage.total_document_scans_used - 1
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear);
    }
  } catch (error) {
    console.error('[DocumentDelete] Error decrementing document usage:', error);
    // Don't throw - this is not critical for the main operation
  }
}

// GET - List user's documents from File Search
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    console.log(`[DocumentList] Fetching files for user ${user.id}`);

    // 2. Get user's files from File Search table
    const { data: files, error: filesError } = await supabaseAdmin
      .from('user_file_search_files')
      .select(`
        id,
        collection_id,
        display_name,
        original_file_name,
        file_size,
        file_type,
        status,
        created_at,
        qna_collections (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('[DocumentList] Fetch error:', filesError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // 3. Format response
    const formattedDocuments = (files || []).map(file => {
      const collection = file.qna_collections as { id: string; name: string } | { id: string; name: string }[] | null;
      let collectionName: string | undefined;

      if (Array.isArray(collection)) {
        collectionName = collection[0]?.name;
      } else if (collection) {
        collectionName = collection.name;
      }

      return {
        id: file.id,
        fileName: file.original_file_name,
        displayName: file.display_name,
        fileSize: file.file_size,
        fileType: file.file_type,
        status: file.status,
        collectionId: file.collection_id,
        collectionName,
        createdAt: file.created_at
      };
    });

    console.log(`[DocumentList] Found ${formattedDocuments.length} files`);

    return NextResponse.json({ documents: formattedDocuments });

  } catch (error) {
    console.error('[DocumentList] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a document from File Search
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    console.log(`[DocumentDelete] Deleting file ${documentId} for user ${user.id}`);

    // 2. Use File Search service to delete (handles ownership verification)
    try {
      await fileSearchService.deleteDocument(user.id, documentId);
    } catch (deleteError) {
      console.error('[DocumentDelete] File Search deletion error:', deleteError);

      if (deleteError instanceof Error) {
        if (deleteError.message.includes('not found')) {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        if (deleteError.message.includes('Unauthorized')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      return NextResponse.json({
        error: 'Failed to delete document',
        details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
      }, { status: 500 });
    }

    // 3. Decrement usage tracking
    await decrementDocumentUsage(user.id);

    console.log(`[DocumentDelete] Successfully deleted file ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('[DocumentDelete] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}