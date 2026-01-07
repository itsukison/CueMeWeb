/**
 * Document Search API (DEPRECATED - Use query-filesearch instead)
 *
 * This endpoint is deprecated. Use /api/documents/query-filesearch for new implementations.
 * Redirects to File Search for backward compatibility.
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

    const { query, collectionId } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    console.log('[DocumentSearch - DEPRECATED] Redirecting to File Search API')

    // For backward compatibility, return a deprecation notice
    return NextResponse.json({
      deprecated: true,
      message: 'This endpoint is deprecated. Please use /api/documents/query-filesearch instead.',
      migration: 'Update your code to use the new File Search endpoint for better performance and accuracy.'
    }, { status: 410 })

  } catch (error) {
    console.error('[DocumentSearch - DEPRECATED] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}