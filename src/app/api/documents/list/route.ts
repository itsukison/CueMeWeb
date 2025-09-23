import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Get user's completed documents only
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, display_name, chunk_count, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('Documents fetch error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Format for electron app
    const formattedDocuments = (documents || []).map(doc => ({
      id: doc.id,
      name: doc.display_name || doc.file_name,
      fileName: doc.file_name,
      chunkCount: doc.chunk_count,
      createdAt: doc.created_at
    }))

    return NextResponse.json({ documents: formattedDocuments })

  } catch (error) {
    console.error('Documents list endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}