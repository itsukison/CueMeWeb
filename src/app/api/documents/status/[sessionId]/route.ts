import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET endpoint to check processing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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

    const { sessionId } = await params

    // Get processing session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('document_processing_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Processing session not found' }, { status: 404 })
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      progress: session.progress,
      currentStep: session.current_step,
      errorMessage: session.error_message,
      collectionId: session.collection_id,
      processingStats: session.processing_stats,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    })

  } catch (error) {
    console.error('Status endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT endpoint to update processing status (for internal use by processing system)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Verify internal API key for security
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const updateData = await request.json()

    // Update processing session
    const { data: session, error: updateError } = await supabaseAdmin
      .from('document_processing_sessions')
      .update({
        status: updateData.status,
        progress: updateData.progress,
        current_step: updateData.currentStep,
        error_message: updateData.errorMessage,
        collection_id: updateData.collectionId,
        processing_stats: updateData.processingStats
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ success: true, session })

  } catch (error) {
    console.error('Update status endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint to cancel processing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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

    const { sessionId } = await params

    // Update session status to cancelled
    const { data: session, error: updateError } = await supabaseAdmin
      .from('document_processing_sessions')
      .update({
        status: 'cancelled',
        current_step: 'Cancelled by user'
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Cancel error:', updateError)
      return NextResponse.json({ error: 'Failed to cancel processing' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Processing cancelled successfully' 
    })

  } catch (error) {
    console.error('Cancel endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}