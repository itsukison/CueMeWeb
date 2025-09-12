import { NextRequest, NextResponse } from 'next/server'
import { processDocumentJob } from '@/lib/document-processor'

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'dev-key'
    if (apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Start processing in the background
    // In production, this should be handled by a proper job queue
    processDocumentJob(sessionId).catch(error => {
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