import { NextRequest, NextResponse } from 'next/server'
import { jobQueue } from '@/lib/job-queue'

// This endpoint processes one job from the queue
// Can be called by Vercel Cron or manually
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Worker endpoint called'
    }))

    // Process one job
    const processed = await jobQueue.processNextJob()

    return NextResponse.json({
      success: true,
      processed,
      message: processed ? 'Job processed' : 'No pending jobs'
    })
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Worker endpoint error'
    }))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
