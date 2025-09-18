import { NextRequest, NextResponse } from 'next/server'
import { processDocumentChunking } from '@/lib/simple-document-processor'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
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

    // Start processing in the background
    // In production, this should be handled by a proper job queue
    processDocumentChunking(documentId).catch(error => {
      console.error('Background processing error:', error)
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Document processing started' 
    })

  } catch (error) {
    console.error('Process endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}