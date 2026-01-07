import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fileSearchService } from '@/lib/gemini-file-search'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Content Verification Endpoint - Tests if document content is actually indexed and queryable
 *
 * POST /api/documents/test-content
 *
 * Body:
 * {
 *   documentId: string,          // UUID of the document to test
 *   testQuery?: string           // Optional custom test query (default: generic query)
 * }
 *
 * Returns:
 * - Whether document is indexed
 * - Test query result
 * - Citations/grounding metadata (proves content is accessible)
 * - Content preview from citations
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // 2. Parse request
    const { documentId, testQuery } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 })
    }

    // 3. Get document metadata
    const { data: document, error: dbError } = await supabaseAdmin
      .from('user_file_search_files')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !document) {
      return NextResponse.json({
        error: 'Document not found',
        contentIndexed: false
      }, { status: 404 })
    }

    // 4. Check if document is ready
    if (document.status !== 'completed') {
      return NextResponse.json({
        error: `Document status is '${document.status}', not ready for querying`,
        contentIndexed: false,
        recommendation: document.status === 'indexing'
          ? 'ドキュメントはまだ処理中です。完了するまでお待ちください'
          : document.status === 'failed'
            ? 'ドキュメントの処理に失敗しました。再アップロードしてください'
            : 'ドキュメントの状態を確認してください'
      }, { status: 400 })
    }

    // 5. Verify file exists in Google File Search
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        contentIndexed: false
      }, { status: 500 })
    }

    let fileStatus = null
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${document.file_search_file_name}?key=${geminiApiKey}`
      )

      if (response.ok) {
        fileStatus = await response.json()
      }
    } catch (error) {
      console.error('[TestContent] Failed to fetch file status:', error)
    }

    if (!fileStatus || fileStatus.state !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Document not active in Google File Search',
        contentIndexed: false,
        fileStatus: fileStatus?.state || 'NOT_FOUND',
        recommendation: 'ドキュメントがGoogleで見つかりません。再アップロードが必要です'
      }, { status: 400 })
    }

    // 6. Perform test query
    const query = testQuery || 'このドキュメントには何が書かれていますか？要約してください。'

    console.log(`[TestContent] Testing document ${documentId} with query: "${query}"`)

    let queryResult = null
    let queryError = null

    try {
      queryResult = await fileSearchService.queryDocuments(
        user.id,
        document.collection_id!,
        query
      )
    } catch (error) {
      queryError = error instanceof Error ? error.message : 'Query failed'
      console.error('[TestContent] Query failed:', error)
    }

    // 7. Analyze query result
    const hasCitations = queryResult?.citations &&
      queryResult.citations.citationSources &&
      queryResult.citations.citationSources.length > 0

    const hasGrounding = queryResult?.groundingMetadata?.groundingChunks &&
      queryResult.groundingMetadata.groundingChunks.length > 0

    const contentIndexed = !queryError &&
      queryResult !== null &&
      (hasCitations || hasGrounding || queryResult.answer.length > 0)

    // 8. Extract content previews from citations
    let contentPreviews: Array<{
      source?: string
      startIndex?: number
      endIndex?: number
      uri?: string
    }> = []

    if (hasCitations && queryResult && queryResult.citations.citationSources) {
      contentPreviews = queryResult.citations.citationSources.map((source: any) => ({
        source: source.uri || source.title || 'Unknown source',
        startIndex: source.startIndex,
        endIndex: source.endIndex,
        uri: source.uri
      }))
    }

    // 9. Extract grounding chunks
    let groundingChunks: Array<{
      content?: string
      relevanceScore?: number
    }> = []

    if (hasGrounding && queryResult && queryResult.groundingMetadata.groundingChunks) {
      groundingChunks = queryResult.groundingMetadata.groundingChunks.slice(0, 3).map((chunk: any) => ({
        content: chunk.content?.substring(0, 200) + (chunk.content?.length > 200 ? '...' : ''),
        relevanceScore: chunk.relevanceScore
      }))
    }

    // 10. Build verification result
    return NextResponse.json({
      contentIndexed,
      verified: contentIndexed,
      document: {
        id: document.id,
        displayName: document.display_name,
        fileName: document.file_search_file_name,
        status: document.status,
        fileSize: document.file_size,
        createdAt: document.created_at
      },
      fileSearch: {
        state: fileStatus.state,
        sizeBytes: fileStatus.sizeBytes,
        mimeType: fileStatus.mimeType
      },
      testQuery: {
        query,
        success: !queryError,
        error: queryError,
        answerLength: queryResult?.answer?.length || 0,
        answerPreview: queryResult?.answer?.substring(0, 300) +
          ((queryResult?.answer?.length ?? 0) > 300 ? '...' : ''),
        hasCitations,
        hasGrounding,
        citationCount: contentPreviews.length,
        groundingChunkCount: groundingChunks.length
      },
      citations: contentPreviews,
      groundingChunks,
      recommendation: contentIndexed
        ? '✅ ドキュメントは正常にインデックスされており、RAGクエリで使用できます'
        : queryError
          ? `❌ クエリエラー: ${queryError}`
          : '⚠️ ドキュメントは存在しますが、コンテンツが取得できませんでした'
    })

  } catch (error) {
    console.error('[TestContent] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      contentIndexed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
