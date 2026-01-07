/**
 * Document List API (File Search Version)
 *
 * Lists documents uploaded to Gemini File Search.
 * This replaces the old documents table with user_file_search_files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // 2. Get optional collection filter from query params
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    console.log(`[DocumentList] Fetching files for user ${user.id}${collectionId ? `, collection ${collectionId}` : ''}`);

    // 3. Query user's files from File Search table
    let query = supabaseAdmin
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

    // Filter by collection if provided
    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      console.error('[DocumentList] Fetch error:', filesError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // 4. Format response for frontend
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
        name: file.display_name,
        fileName: file.original_file_name,
        fileSize: file.file_size,
        fileType: file.file_type,
        status: file.status,
        collectionId: file.collection_id,
        collectionName,
        createdAt: file.created_at
      };
    });

    console.log(`[DocumentList] Found ${formattedDocuments.length} files`);

    return NextResponse.json({
      documents: formattedDocuments,
      count: formattedDocuments.length
    });

  } catch (error) {
    console.error('[DocumentList] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}