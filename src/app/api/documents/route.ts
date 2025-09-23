import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function decrementDocumentUsage(userId: string): Promise<void> {
  try {
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Get current usage
    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('scanned_documents_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (usage && usage.scanned_documents_used > 0) {
      // Decrement usage count
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          scanned_documents_used: usage.scanned_documents_used - 1
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    }
  } catch (error) {
    console.error('Error decrementing document usage:', error)
    // Don't throw - this is not critical for the main operation
  }
}

// GET - List user's documents
export async function GET(request: NextRequest) {
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

    // Get user's documents
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, display_name, file_size, file_type, status, chunk_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('Documents fetch error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Documents list endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a document and its chunks
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

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Verify the document belongs to the user
    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, file_path, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    // Delete chunks first (should cascade automatically, but being explicit)
    const { error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)

    if (chunksError) {
      console.error('Chunks deletion error:', chunksError)
      return NextResponse.json({ error: 'Failed to delete document chunks' }, { status: 500 })
    }

    // Delete the document record
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Document deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // Decrement usage tracking
    await decrementDocumentUsage(user.id)

    // Try to delete the file from storage (non-critical if it fails)
    try {
      if (document.file_path) {
        await supabaseAdmin.storage.from('documents').remove([document.file_path])
      }
    } catch (storageError) {
      console.warn('Storage file deletion failed:', storageError)
      // Don't fail the request if storage deletion fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    })

  } catch (error) {
    console.error('Document deletion endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}