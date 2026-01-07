/**
 * DEPRECATED: Job Queue System for Document Processing
 *
 * This file is deprecated as File Search handles document processing automatically.
 * Kept for backward compatibility only.
 */

import { createClient } from '@supabase/supabase-js'
import { envValidator } from './env-validator'

const config = envValidator.getConfig()
const supabaseAdmin = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
)

interface Job {
  id: string
  document_id: string
  status: string
  attempts: number
  max_attempts: number
  error_message?: string
}

class JobQueue {
  private processing = false
  private pollInterval = 5000 // 5 seconds
  private maxConcurrent = 3

  async enqueue(documentId: string, priority = 0): Promise<void> {
    const { error } = await supabaseAdmin
      .from('processing_jobs')
      .insert({
        document_id: documentId,
        status: 'pending',
        priority,
        attempts: 0,
        max_attempts: 3,
        metadata: { enqueued_at: new Date().toISOString() }
      })

    if (error) {
      console.error('Failed to enqueue job:', error)
      throw new Error('Failed to enqueue processing job')
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      documentId,
      priority,
      message: 'Job enqueued successfully'
    }))
  }

  async processNextJob(): Promise<boolean> {
    // Get next pending job
    const { data: jobs, error } = await supabaseAdmin
      .from('processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(1)

    if (error || !jobs || jobs.length === 0) {
      return false
    }

    const job = jobs[0] as Job

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      jobId: job.id,
      documentId: job.document_id,
      attempts: job.attempts + 1,
      message: 'Starting job processing'
    }))

    // Mark as processing
    const { error: updateError } = await supabaseAdmin
      .from('processing_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1
      })
      .eq('id', job.id)

    if (updateError) {
      console.error('Failed to update job status:', updateError)
      return false
    }

    // DEPRECATED: Document processing now handled by File Search
    try {
      throw new Error('Document processing is deprecated. Use File Search API instead.')
    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        jobId: job.id,
        documentId: job.document_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        message: 'Job processing failed'
      }))

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined

      // Check if we should retry
      if (job.attempts + 1 < job.max_attempts) {
        // Retry with exponential backoff
        const backoffMs = Math.pow(2, job.attempts) * 1000
        const scheduledAt = new Date(Date.now() + backoffMs)

        await supabaseAdmin
          .from('processing_jobs')
          .update({
            status: 'pending',
            scheduled_at: scheduledAt.toISOString(),
            error_message: errorMessage
          })
          .eq('id', job.id)

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          jobId: job.id,
          documentId: job.document_id,
          retryIn: backoffMs,
          message: 'Job scheduled for retry'
        }))
      } else {
        // Max retries reached, mark as failed
        await supabaseAdmin
          .from('processing_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            error_stack: errorStack,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          jobId: job.id,
          documentId: job.document_id,
          message: 'Job failed after max retries'
        }))
      }

      return false
    }
  }

  async startWorker(): Promise<void> {
    if (this.processing) return
    this.processing = true

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Job queue worker started'
    }))

    while (this.processing) {
      try {
        const processed = await this.processNextJob()
        if (!processed) {
          // No jobs available, wait before checking again
          await new Promise(resolve => setTimeout(resolve, this.pollInterval))
        }
      } catch (error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Worker error'
        }))
        await new Promise(resolve => setTimeout(resolve, this.pollInterval))
      }
    }
  }

  stopWorker(): void {
    this.processing = false
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Job queue worker stopped'
    }))
  }
}

export const jobQueue = new JobQueue()
