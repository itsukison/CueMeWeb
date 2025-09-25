import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

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

    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 })
    }

    // Files are now unlimited, so no need to check file limits
    // QnA pairs and document scans are tracked globally instead

    // Create the collection
    const { data: collectionData, error: collectionError } = await supabaseAdmin
      .from('qna_collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (collectionError) {
      console.error('Collection creation error:', collectionError)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    // No need to track file creation anymore since files are unlimited

    return NextResponse.json({
      success: true,
      collection: collectionData,
      message: 'Collection created successfully.'
    })

  } catch (error) {
    console.error('Collection creation endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function incrementQnaFileUsage(userId: string): Promise<void> {
  try {
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Check if usage record exists
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('qna_files_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (existingUsage) {
      // Update existing record
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          qna_files_used: existingUsage.qna_files_used + 1
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    } else {
      // Create new record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          qna_files_used: 1,
          scanned_documents_used: 0,
          questions_used: 0
        })
    }
  } catch (error) {
    console.error('Error incrementing QNA file usage:', error)
    // Don't throw - this is not critical for the main operation
  }
}

// DELETE - Delete a QNA collection
export async function DELETE(request: NextRequest) {
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

    const { collectionId } = await request.json()

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })
    }

    // Verify the collection belongs to the user
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('qna_collections')
      .select('id, name, user_id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
    }

    // Delete QNA items first (should cascade automatically, but being explicit)
    const { error: itemsError } = await supabaseAdmin
      .from('qna_items')
      .delete()
      .eq('collection_id', collectionId)

    if (itemsError) {
      console.error('QNA items deletion error:', itemsError)
      return NextResponse.json({ error: 'Failed to delete collection items' }, { status: 500 })
    }

    // Delete the collection record
    const { error: deleteError } = await supabaseAdmin
      .from('qna_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Collection deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
    }

    // Update usage tracking to reflect deleted QnA pairs
    await updateQnAUsageAfterDeletion(user.id, collectionId)

    return NextResponse.json({ 
      success: true, 
      message: 'Collection deleted successfully' 
    })

  } catch (error) {
    console.error('Collection deletion endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateQnAUsageAfterDeletion(userId: string, collectionId: string): Promise<void> {
  try {
    // Count how many QnA pairs were in the deleted collection
    // Since we already deleted them, we need to get the current total across all collections
    const { count: totalQnaPairs } = await supabaseAdmin
      .from('qna_items')
      .select('*, qna_collections!inner(user_id)', { count: 'exact' })
      .eq('qna_collections.user_id', userId)

    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Update the usage tracking with the current total
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_qna_pairs_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (existingUsage) {
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_qna_pairs_used: totalQnaPairs || 0
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    } else {
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          total_qna_pairs_used: totalQnaPairs || 0,
          total_document_scans_used: 0,
          questions_used: 0
        })
    }
  } catch (error) {
    console.error('Error updating QnA usage after deletion:', error)
  }
}