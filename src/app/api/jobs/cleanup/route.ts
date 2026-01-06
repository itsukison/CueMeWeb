import { NextRequest, NextResponse } from 'next/server'
import { cleanupStuckDocuments } from '@/lib/cleanup-stuck-documents'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const result = await cleanupStuckDocuments()

    return NextResponse.json({
      success: true,
      cleaned: result.cleaned,
      errors: result.errors
    })
  } catch (error) {
    console.error('Cleanup endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
