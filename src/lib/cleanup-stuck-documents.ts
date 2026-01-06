import { createClient } from '@supabase/supabase-js'
import { envValidator } from './env-validator'

const config = envValidator.getConfig()
const supabaseAdmin = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
)

const TIMEOUT_MINUTES = 15

export async function cleanupStuckDocuments(): Promise<{
  cleaned: number
  errors: string[]
}> {
  const errors: string[] = []
  let cleaned = 0

  try {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Starting cleanup of stuck documents'
    }))

    // Find documents stuck in processing for more than TIMEOUT_MINUTES
    const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000)

    const { data: stuckDocs, error: queryError } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, processing_started_at, processing_stage')
      .eq('status', 'processing')
      .lt('processing_started_at', timeoutThreshold.toISOString())

    if (queryError) {
      errors.push(`Query error: ${queryError.message}`)
      return { cleaned, errors }
    }

    if (!stuckDocs || stuckDocs.length === 0) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'No stuck documents found'
      }))
      return { cleaned: 0, errors: [] }
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      stuckCount: stuckDocs.length,
      message: 'Found stuck documents'
    }))

    // Mark each stuck document as failed
    for (const doc of stuckDocs) {
      const { error: updateError } = await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          error_message: `Processing timed out after ${TIMEOUT_MINUTES} minutes`,
          processing_error_details: {
            reason: 'timeout',
            timeout_minutes: TIMEOUT_MINUTES,
            stuck_at_stage: doc.processing_stage,
            cleaned_at: new Date().toISOString()
          }
        })
        .eq('id', doc.id)

      if (updateError) {
        errors.push(`Failed to update document ${doc.id}: ${updateError.message}`)
      } else {
        cleaned++
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          documentId: doc.id,
          fileName: doc.file_name,
          message: 'Cleaned up stuck document'
        }))
      }
    }

    // Also cleanup stuck jobs
    const { error: jobCleanupError } = await supabaseAdmin
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: 'Job timed out and was cleaned up',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('started_at', timeoutThreshold.toISOString())

    if (jobCleanupError) {
      errors.push(`Job cleanup error: ${jobCleanupError.message}`)
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      cleaned,
      errors: errors.length,
      message: 'Cleanup completed'
    }))

  } catch (error) {
    errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
  }

  return { cleaned, errors }
}
