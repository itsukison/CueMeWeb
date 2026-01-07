/**
 * Document Query API (File Search Version)
 *
 * Handles RAG queries using Gemini File Search.
 * This replaces the old pipeline: OpenAI Embedding → Vector Search → Result formatting
 * With: Direct Gemini File Search query with automatic RAG
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

export async function POST(request: NextRequest) {
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

    // 2. Parse request body
    const { query, collectionId } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`[QueryFileSearch] User ${user.id} querying: "${query.substring(0, 50)}..."`);

    // 3. Verify collection ownership if provided
    if (collectionId) {
      const { data: collection, error: collectionError } = await supabaseAdmin
        .from('qna_collections')
        .select('id, user_id, uses_file_search')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

      if (collectionError || !collection) {
        return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
      }

      if (!collection.uses_file_search) {
        return NextResponse.json({
          error: 'Collection does not have File Search enabled. Please upload documents first.'
        }, { status: 400 });
      }
    }

    // 4. Query File Search with RAG
    const response = await fileSearchService.queryDocuments(
      user.id,
      collectionId,
      query
    );

    console.log(`[QueryFileSearch] Query successful, answer length: ${response.answer.length}`);

    // 5. Return formatted response
    return NextResponse.json({
      answer: response.answer,
      citations: response.citations,
      groundingMetadata: response.groundingMetadata,
      query: query
    });

  } catch (error) {
    console.error('[QueryFileSearch] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
