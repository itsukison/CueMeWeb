/**
 * Document Query API (Supabase pgvector Version)
 * 
 * Handles RAG queries using Supabase pgvector vector search.
 * Flow: Query → Generate Embedding → Vector Search → Return Chunks
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from '@/lib/embedding-service';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DocumentChunk {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    char_start: number;
    char_end: number;
    similarity: number;
}

export interface QueryResponse {
    chunks: DocumentChunk[];
    hasRelevantContent: boolean;
    topSimilarity: number;
    query: string;
}

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
        const { query, collectionId, matchThreshold = 0.6, matchCount = 5 } = await request.json();

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!collectionId) {
            return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
        }

        console.log(`[DocumentQuery] User ${user.id} querying: "${query.substring(0, 50)}..." with threshold ${matchThreshold}`);

        // 3. Verify collection ownership
        const { data: collection, error: collectionError } = await supabaseAdmin
            .from('qna_collections')
            .select('id, user_id')
            .eq('id', collectionId)
            .eq('user_id', user.id)
            .single();

        if (collectionError || !collection) {
            return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
        }

        // 4. Generate query embedding
        let queryEmbedding: number[];
        try {
            queryEmbedding = await generateQueryEmbedding(query);
        } catch (embedError) {
            console.error('[DocumentQuery] Failed to generate query embedding:', embedError);
            return NextResponse.json({
                error: 'Failed to process query',
                details: embedError instanceof Error ? embedError.message : 'Unknown error'
            }, { status: 500 });
        }

        // 5. Vector search in Supabase
        const { data: chunks, error: searchError } = await supabaseAdmin.rpc(
            'search_document_chunks',
            {
                query_embedding: queryEmbedding,
                collection_id_filter: collectionId,
                match_threshold: matchThreshold,
                match_count: matchCount
            }
        );

        if (searchError) {
            console.error('[DocumentQuery] Vector search error:', searchError);
            return NextResponse.json({
                error: 'Search failed',
                details: searchError.message
            }, { status: 500 });
        }

        const hasRelevantContent = chunks && chunks.length > 0;
        const topSimilarity = hasRelevantContent ? chunks[0].similarity : 0;

        console.log(`[DocumentQuery] Found ${chunks?.length || 0} relevant chunks, top similarity: ${topSimilarity.toFixed(3)}`);

        // 6. Return results
        const response: QueryResponse = {
            chunks: chunks || [],
            hasRelevantContent,
            topSimilarity,
            query
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('[DocumentQuery] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
