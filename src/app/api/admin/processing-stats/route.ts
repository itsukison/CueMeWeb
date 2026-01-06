import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { envValidator } from '@/lib/env-validator'

const config = envValidator.getConfig()
const supabaseAdmin = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request: NextRequest) {
  try {
    // Get document status counts
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('status')

    const statusCounts = documents?.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get job queue stats
    const { data: jobs } = await supabaseAdmin
      .from('processing_jobs')
      .select('status, attempts')

    const jobStats = jobs?.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      if (job.attempts > 1) {
        acc.retried = (acc.retried || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Get stuck documents count
    const timeoutThreshold = new Date(Date.now() - 15 * 60 * 1000)
    const { count: stuckCount } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('processing_started_at', timeoutThreshold.toISOString())

    // Get recent processing times
    const { data: completedDocs } = await supabaseAdmin
      .from('documents')
      .select('processing_started_at, processing_completed_at')
      .eq('status', 'completed')
      .not('processing_started_at', 'is', null)
      .not('processing_completed_at', 'is', null)
      .order('processing_completed_at', { ascending: false })
      .limit(10)

    const processingTimes = completedDocs?.map(doc => {
      const start = new Date(doc.processing_started_at).getTime()
      const end = new Date(doc.processing_completed_at).getTime()
      return Math.round((end - start) / 1000) // seconds
    }) || []

    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0

    return NextResponse.json({
      documentStatus: statusCounts,
      jobQueue: jobStats,
      stuckDocuments: stuckCount || 0,
      avgProcessingTimeSeconds: avgProcessingTime,
      recentProcessingTimes: processingTimes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stats endpoint error'
    }))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
