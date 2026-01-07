import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
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

    const { documentId } = await params

    // 1. Check new File Search table first
    const { data: fileSearchFile, error: fileSearchError } = await supabaseAdmin
      .from('user_file_search_files')
      .select('id, status, error_message, created_at, updated_at, file_search_file_name')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fileSearchFile && !fileSearchError) {
      // Calculate progressive indexing progress based on elapsed time
      let processingProgress = 0
      let estimatedTimeRemaining = null

      if (fileSearchFile.status === 'completed') {
        processingProgress = 100
      } else if (fileSearchFile.status === 'indexing') {
        // Calculate elapsed time since file creation
        const createdAt = new Date(fileSearchFile.created_at).getTime()
        const now = Date.now()
        const elapsedSeconds = (now - createdAt) / 1000

        // Simulated progress curve (reaches 95% at ~60 seconds)
        // Uses logarithmic curve: starts fast, slows down as it approaches completion
        if (elapsedSeconds < 60) {
          processingProgress = Math.min(95, 30 + (elapsedSeconds / 60) * 65)
        } else {
          processingProgress = 95 // Stay at 95% until confirmed complete
        }

        // Estimate remaining time (assuming 60-90 seconds total)
        const estimatedTotalSeconds = 75
        const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds)
        estimatedTimeRemaining = Math.ceil(remainingSeconds)
      } else {
        processingProgress = 0
      }

      return NextResponse.json({
        id: fileSearchFile.id,
        status: fileSearchFile.status,
        chunkCount: 0, // Ignored for File Search
        fileName: fileSearchFile.file_search_file_name,
        createdAt: fileSearchFile.created_at,
        updatedAt: fileSearchFile.updated_at,
        error_message: fileSearchFile.error_message,
        processing_stage: fileSearchFile.status === 'indexing' ? 'indexing' : (fileSearchFile.status === 'completed' ? 'completed' : null),
        processing_progress: Math.floor(processingProgress),
        processing_started_at: fileSearchFile.created_at,
        processing_completed_at: fileSearchFile.status === 'completed' ? fileSearchFile.updated_at : null,
        processing_error_details: null,
        estimated_time_remaining: estimatedTimeRemaining
      })
    }

    // 2. Fallback to legacy 'documents' table
    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        status,
        chunk_count,
        file_name,
        created_at,
        updated_at,
        error_message,
        processing_stage,
        processing_progress,
        processing_started_at,
        processing_completed_at,
        processing_error_details
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If completed, also get chunk count from actual chunks table
    let actualChunkCount = document.chunk_count
    if (document.status === 'completed') {
      const { count } = await supabaseAdmin
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId)

      actualChunkCount = count || 0
    }

    return NextResponse.json({
      id: document.id,
      status: document.status,
      chunkCount: actualChunkCount,
      fileName: document.file_name,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      error_message: document.error_message,
      processing_stage: document.processing_stage,
      processing_progress: document.processing_progress,
      processing_started_at: document.processing_started_at,
      processing_completed_at: document.processing_completed_at,
      processing_error_details: document.processing_error_details
    })

  } catch (error) {
    console.error('Document status endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}