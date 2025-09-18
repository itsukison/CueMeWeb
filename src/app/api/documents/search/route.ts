import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { generateEnhancedEmbedding } from '@/lib/openai'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { query, limit = 10 } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Generate embedding for the search query
    const { embedding } = await generateEnhancedEmbedding(query)

    // Search for similar chunks using vector similarity
    const { data: chunks, error: searchError } = await supabaseAdmin
      .rpc('search_document_chunks', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        user_id_filter: user.id
      })

    if (searchError) {
      console.error('Search error:', searchError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Get document information for each chunk
    const chunksWithDocuments = await Promise.all(
      (chunks || []).map(async (chunk: any) => {
        const { data: document } = await supabaseAdmin
          .from('documents')
          .select('id, file_name, display_name')
          .eq('id', chunk.document_id)
          .single()

        return {
          id: chunk.id,
          text: chunk.chunk_text,
          similarity: chunk.similarity,
          document: document ? {
            id: document.id,
            fileName: document.file_name,
            displayName: document.display_name || document.file_name
          } : null
        }
      })
    )

    return NextResponse.json({
      results: chunksWithDocuments,
      query: query
    })

  } catch (error) {
    console.error('Document search endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}