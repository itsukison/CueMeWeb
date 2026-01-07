/**
 * Document Processing API (DEPRECATED - Use upload-filesearch instead)
 *
 * This endpoint is deprecated. File Search handles document processing automatically.
 * Use /api/documents/upload-filesearch for new document uploads.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    console.log('[DocumentProcess - DEPRECATED] This endpoint is no longer needed with File Search')

    // For backward compatibility, return a deprecation notice
    return NextResponse.json({
      deprecated: true,
      message: 'This endpoint is deprecated. File Search handles document processing automatically.',
      migration: 'Use /api/documents/upload-filesearch for uploading documents. Processing happens automatically.'
    }, { status: 410 })

  } catch (error) {
    console.error('[DocumentProcess - DEPRECATED] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
