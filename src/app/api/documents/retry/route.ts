import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { envValidator } from '@/lib/env-validator'
import { jobQueue } from '@/lib/job-queue'

const config = envValidator.getConfig()
const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = config.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAdmin = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Create supabase client with proper JWT context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Verify document exists and belongs to user
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id, status, retry_count, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only allow retry for failed documents
    if (document.status !== 'failed') {
      return NextResponse.json({
        error: 'Document is not in failed state',
        currentStatus: document.status
      }, { status: 400 })
    }

    // Check retry limit
    if (document.retry_count >= 3) {
      return NextResponse.json({
        error: 'Maximum retry attempts reached (3)',
        retryCount: document.retry_count
      }, { status: 400 })
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      documentId,
      userId: user.id,
      retryCount: document.retry_count + 1,
      message: 'Retrying document processing'
    }))

    // Reset document to pending
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'pending',
        error_message: null,
        processing_error_details: null,
        processing_stage: null,
        processing_progress: 0,
        retry_count: document.retry_count + 1,
        last_retry_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Enqueue for processing with high priority
    await jobQueue.enqueue(documentId, 10) // Higher priority for retries

    return NextResponse.json({
      success: true,
      message: 'Document queued for retry',
      retryCount: document.retry_count + 1
    })
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Retry endpoint error'
    }))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
