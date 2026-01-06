import { NextRequest, NextResponse } from 'next/server'
import { processDocumentChunking } from '@/lib/simple-document-processor'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check for required API keys
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY')
      return NextResponse.json({ error: 'Server configuration error: Missing Gemini API Key' }, { status: 500 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY')
      return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 })
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Create supabase client with proper JWT context for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify the user and set the session context
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    console.log('[Process API] Processing document:', documentId, 'for user:', user.id)
    console.log('[Process API] User object:', JSON.stringify(user, null, 2))

    // Verify the document exists and belongs to the authenticated user (RLS handles ownership)
    // Add retry logic in case of timing issues
    let document = null
    let docError = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase
        .from('documents')
        .select('id, user_id, status')
        .eq('id', documentId)
        .single()

      document = result.data
      docError = result.error

      if (document) break

      // Wait a bit before retrying
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (docError || !document) {
      console.error('Document query error after retries:', docError, 'Document ID:', documentId, 'User ID:', user.id)
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    if (document.status !== 'pending') {
      return NextResponse.json({ error: 'Document is not in pending status' }, { status: 400 })
    }

    // Enqueue job for processing (job queue handles retries)
    // For Hobby plan: Jobs processed on-demand via client polling or manual trigger
    // For Pro plan: Add worker cron job to vercel.json to process automatically
    try {
      const { jobQueue } = await import('@/lib/job-queue')

      // Enqueue the job
      await jobQueue.enqueue(documentId)

      // Immediately process one job (for Hobby plan without cron)
      // This starts processing but returns immediately
      jobQueue.processNextJob().catch(error => {
        console.error('[Process API] Background job error:', error)
      })

      return NextResponse.json({
        success: true,
        message: 'Document processing queued',
        documentId
      })
    } catch (error) {
      console.error('[Process API] Failed to enqueue job:', error)

      // Fallback: mark document as failed
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          error_message: 'Failed to queue processing job'
        })
        .eq('id', documentId)

      return NextResponse.json({
        success: false,
        error: 'Failed to queue processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Process endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}