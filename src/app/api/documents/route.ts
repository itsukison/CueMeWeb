/**
 * Documents API (Supabase pgvector Version)
 *
 * Handles document listing and deletion with Supabase pgvector.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

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

// GET - List user's documents
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

    console.log(`[DocumentList] Fetching documents for user ${user.id}`);

    // 2. Get user's documents from documents table
    const { data: docs, error: docsError } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        collection_id,
        display_name,
        original_file_name,
        file_size,
        file_type,
        status,
        chunk_count,
        created_at,
        qna_collections (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('[DocumentList] Fetch error:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // 3. Format response
    const formattedDocuments = (docs || []).map(doc => {
      const collection = doc.qna_collections as { id: string; name: string } | { id: string; name: string }[] | null;
      let collectionName: string | undefined;

      if (Array.isArray(collection)) {
        collectionName = collection[0]?.name;
      } else if (collection) {
        collectionName = collection.name;
      }

      return {
        id: doc.id,
        fileName: doc.original_file_name,
        displayName: doc.display_name,
        fileSize: doc.file_size,
        fileType: doc.file_type,
        status: doc.status,
        chunkCount: doc.chunk_count,
        collectionId: doc.collection_id,
        collectionName,
        createdAt: doc.created_at
      };
    });

    console.log(`[DocumentList] Found ${formattedDocuments.length} documents`);

    return NextResponse.json({ documents: formattedDocuments });

  } catch (error) {
    console.error('[DocumentList] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a document and its chunks
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

    console.log(`[DocumentDelete] Deleting document ${documentId} for user ${user.id}`);

    // 2. Verify ownership and delete (CASCADE will delete chunks automatically)
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      console.error('[DocumentDelete] Document not found:', fetchError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.user_id !== user.id) {
      console.error('[DocumentDelete] Access denied - user does not own document');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete document (CASCADE will delete associated chunks)
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('[DocumentDelete] Delete error:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete document',
        details: deleteError.message
      }, { status: 500 });
    }

    // 3. Decrement usage tracking
    await decrementDocumentUsage(user.id);

    console.log(`[DocumentDelete] Successfully deleted document ${documentId}`);

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