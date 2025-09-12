import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET endpoint to retrieve Q&As for review
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const sessionId = params.sessionId

    // Get processing session to verify ownership and get collection_id
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('document_processing_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Processing session not found' }, { status: 404 })
    }

    if (!session.collection_id) {
      return NextResponse.json({ error: 'No collection associated with this session' }, { status: 404 })
    }

    // Get all Q&A items for review
    const { data: qnaItems, error: qnaError } = await supabaseAdmin
      .from('qna_items')
      .select('*')
      .eq('collection_id', session.collection_id)
      .order('created_at', { ascending: true })

    if (qnaError) {
      console.error('QnA fetch error:', qnaError)
      return NextResponse.json({ error: 'Failed to fetch Q&A items' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: session.id,
      collectionId: session.collection_id,
      items: qnaItems,
      processingStats: session.processing_stats
    })

  } catch (error) {
    console.error('Review endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint to finalize reviewed Q&As
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const sessionId = params.sessionId
    const { approvedItemIds, collectionName } = await request.json()

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

    if (!session.collection_id) {
      return NextResponse.json({ error: 'No collection associated with this session' }, { status: 404 })
    }

    // Update collection name if provided
    if (collectionName) {
      const { error: collectionUpdateError } = await supabaseAdmin
        .from('qna_collections')
        .update({ name: collectionName })
        .eq('id', session.collection_id)

      if (collectionUpdateError) {
        console.error('Collection update error:', collectionUpdateError)
        return NextResponse.json({ error: 'Failed to update collection name' }, { status: 500 })
      }
    }

    // Update approval status for all items
    const { data: allItems, error: allItemsError } = await supabaseAdmin
      .from('qna_items')
      .select('id')
      .eq('collection_id', session.collection_id)

    if (allItemsError) {
      console.error('Items fetch error:', allItemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Mark approved items
    if (approvedItemIds && approvedItemIds.length > 0) {
      const { error: approveError } = await supabaseAdmin
        .from('qna_items')
        .update({ review_status: 'approved' })
        .in('id', approvedItemIds)

      if (approveError) {
        console.error('Approve error:', approveError)
        return NextResponse.json({ error: 'Failed to approve items' }, { status: 500 })
      }
    }

    // Mark rejected items
    const rejectedIds = allItems
      .map(item => item.id)
      .filter(id => !approvedItemIds.includes(id))

    if (rejectedIds.length > 0) {
      const { error: rejectError } = await supabaseAdmin
        .from('qna_items')
        .update({ review_status: 'rejected' })
        .in('id', rejectedIds)

      if (rejectError) {
        console.error('Reject error:', rejectError)
        return NextResponse.json({ error: 'Failed to reject items' }, { status: 500 })
      }
    }

    // Update session status to completed
    const { error: sessionUpdateError } = await supabaseAdmin
      .from('document_processing_sessions')
      .update({ 
        status: 'completed',
        progress: 100,
        current_step: 'Review completed'
      })
      .eq('id', sessionId)

    if (sessionUpdateError) {
      console.error('Session update error:', sessionUpdateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      collectionId: session.collection_id,
      approvedCount: approvedItemIds.length,
      rejectedCount: rejectedIds.length,
      message: 'Review completed successfully'
    })

  } catch (error) {
    console.error('Review finalize endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}