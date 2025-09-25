import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Increment QnA pair usage tracking when a new QnA pair is created
 */
export async function incrementQnAUsage(userId: string, count: number = 1): Promise<void> {
  try {
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Check if usage record exists
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_qna_pairs_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (existingUsage) {
      // Update existing record
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_qna_pairs_used: Math.max(0, (existingUsage.total_qna_pairs_used || 0) + count)
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    } else {
      // Create new record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          total_qna_pairs_used: Math.max(0, count),
          total_document_scans_used: 0,
          questions_used: 0
        })
    }
  } catch (error) {
    console.error('Error incrementing QnA usage:', error)
    // Don't throw - this is not critical for the main operation
  }
}

/**
 * Increment document scan usage tracking when a document is processed
 */
export async function incrementDocumentScanUsage(userId: string): Promise<void> {
  try {
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Check if usage record exists
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_document_scans_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (existingUsage) {
      // Update existing record
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_document_scans_used: (existingUsage.total_document_scans_used || 0) + 1
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    } else {
      // Create new record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          total_qna_pairs_used: 0,
          total_document_scans_used: 1,
          questions_used: 0
        })
    }
  } catch (error) {
    console.error('Error incrementing document scan usage:', error)
    // Don't throw - this is not critical for the main operation
  }
}

/**
 * Sync usage tracking with actual database counts (for data consistency)
 */
export async function syncUsageTracking(userId: string): Promise<void> {
  try {
    // Get actual counts from database
    const { count: totalQnaPairs } = await supabaseAdmin
      .from('qna_items')
      .select('*, qna_collections!inner(user_id)', { count: 'exact' })
      .eq('qna_collections.user_id', userId)

    const { count: totalDocumentScans } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')

    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Update usage tracking with actual counts
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('questions_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    if (existingUsage) {
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_qna_pairs_used: totalQnaPairs || 0,
          total_document_scans_used: totalDocumentScans || 0
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
    } else {
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          total_qna_pairs_used: totalQnaPairs || 0,
          total_document_scans_used: totalDocumentScans || 0,
          questions_used: 0
        })
    }
  } catch (error) {
    console.error('Error syncing usage tracking:', error)
  }
}