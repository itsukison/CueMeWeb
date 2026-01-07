import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Verification endpoint to check if documents are correctly saved in Google File Search
 *
 * GET /api/documents/verify-filesearch?documentId=<uuid>
 *
 * Returns:
 * - Document metadata from Supabase
 * - Live status from Google File Search API
 * - Verification result
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId parameter required' }, { status: 400 })
    }

    // Get authentication
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

    // 1. Get document metadata from Supabase
    const { data: fileSearchFile, error: dbError } = await supabaseAdmin
      .from('user_file_search_files')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !fileSearchFile) {
      return NextResponse.json({
        error: 'Document not found in database',
        verified: false
      }, { status: 404 })
    }

    // 2. Verify file exists in Google File Search
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        verified: false
      }, { status: 500 })
    }

    let geminiFileStatus = null
    let geminiError = null

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileSearchFile.file_search_file_name}?key=${geminiApiKey}`
      )

      if (response.ok) {
        geminiFileStatus = await response.json()
      } else {
        const errorText = await response.text()
        geminiError = `Gemini API error: ${response.status} ${errorText}`
      }
    } catch (apiError) {
      geminiError = apiError instanceof Error ? apiError.message : 'Failed to contact Gemini API'
    }

    // 3. Build verification result
    const isVerified = geminiFileStatus && geminiFileStatus.state === 'ACTIVE'

    return NextResponse.json({
      verified: isVerified,
      database: {
        id: fileSearchFile.id,
        fileName: fileSearchFile.file_search_file_name,
        displayName: fileSearchFile.display_name,
        status: fileSearchFile.status,
        createdAt: fileSearchFile.created_at,
        updatedAt: fileSearchFile.updated_at,
        errorMessage: fileSearchFile.error_message
      },
      gemini: geminiFileStatus ? {
        name: geminiFileStatus.name,
        displayName: geminiFileStatus.displayName,
        state: geminiFileStatus.state,
        sizeBytes: geminiFileStatus.sizeBytes,
        mimeType: geminiFileStatus.mimeType,
        createTime: geminiFileStatus.createTime,
        updateTime: geminiFileStatus.updateTime,
        expirationTime: geminiFileStatus.expirationTime
      } : null,
      geminiError,
      recommendation: isVerified
        ? 'ドキュメントは正常にGoogle File Searchに保存されています'
        : geminiFileStatus?.state === 'PROCESSING'
        ? 'ドキュメントは処理中です。しばらくお待ちください'
        : geminiFileStatus?.state === 'FAILED'
        ? 'ドキュメントの処理に失敗しました。再アップロードをお試しください'
        : 'ドキュメントが見つかりませんでした。再アップロードが必要な可能性があります'
    })

  } catch (error) {
    console.error('[Verify FileSearch] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      verified: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
