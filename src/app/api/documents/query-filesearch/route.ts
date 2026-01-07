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

    // 5. Analyze grounding quality to determine if response is actually from documents
    // Gemini File Search may use different structures for grounding metadata
    const groundingChunks = response.groundingMetadata?.groundingChunks || [];
    const groundingSupports = response.groundingMetadata?.groundingSupports || [];
    const retrievalMetadata = response.groundingMetadata?.retrievalMetadata;

    // Check 1: Traditional groundingChunks with relevanceScore
    const hasGroundingChunks = groundingChunks.length > 0;
    const hasHighRelevanceChunks = groundingChunks.some(
      (chunk: { relevanceScore?: number }) => chunk.relevanceScore && chunk.relevanceScore > 0.5
    );

    // Check 2: Any grounding metadata exists (indicates Gemini used documents)
    const hasAnyGroundingSignal =
      hasGroundingChunks ||
      groundingSupports.length > 0 ||
      retrievalMetadata !== undefined ||
      Object.keys(response.groundingMetadata || {}).length > 0;

    // Check 3: Negative pattern - AI self-references indicate NO grounding
    const aiSelfReferencePatterns = [
      '私はAI', '人工知能', '言語モデル', 'Googleによってトレーニング',
      '該当する情報が見つかりませんでした', 'I am an AI', 'language model'
    ];
    const containsAISelfReference = aiSelfReferencePatterns.some(
      pattern => response.answer.includes(pattern)
    );

    // Final grounding decision:
    // - If we have high relevance chunks, definitely grounded
    // - If we have any grounding signal AND no AI self-reference, likely grounded
    // - If answer contains AI self-reference, NOT grounded
    const isGrounded = containsAISelfReference
      ? false
      : (hasHighRelevanceChunks || hasAnyGroundingSignal);

    console.log(`[QueryFileSearch] Grounding analysis:`, {
      groundingChunksCount: groundingChunks.length,
      groundingSupportsCount: groundingSupports.length,
      hasRetrievalMetadata: !!retrievalMetadata,
      hasHighRelevanceChunks,
      hasAnyGroundingSignal,
      containsAISelfReference,
      isGrounded
    });

    // 6. Return formatted response with grounding flag
    return NextResponse.json({
      answer: response.answer,
      citations: response.citations,
      groundingMetadata: response.groundingMetadata,
      isGrounded,
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
