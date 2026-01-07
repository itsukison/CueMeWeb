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

    // Check documents table
    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select(`
        id,
        status,
        chunk_count,
        original_file_name,
        created_at,
        updated_at,
        error_message
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Calculate progress for processing status
    let processingProgress = 0
    if (document.status === 'completed') {
      processingProgress = 100
    } else if (document.status === 'processing') {
      // Estimate based on time elapsed
      const createdAt = new Date(document.created_at).getTime()
      const now = Date.now()
      const elapsedSeconds = (now - createdAt) / 1000

      // Progressive curve (reaches 90% at ~30 seconds)
      processingProgress = Math.min(90, (elapsedSeconds / 30) * 90)
    }

    return NextResponse.json({
      id: document.id,
      status: document.status,
      chunkCount: document.chunk_count || 0,
      fileName: document.original_file_name,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      error_message: document.error_message,
      processing_progress: Math.floor(processingProgress),
    })

  } catch (error) {
    console.error('Document status endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}