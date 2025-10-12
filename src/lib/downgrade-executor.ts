import { createClient } from '@supabase/supabase-js'
import { getFilesWithQnACounts } from './usage-enforcement'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ScheduledChange {
  id: string
  user_id: string
  current_plan_id: string
  target_plan_id: string
  change_type: string
  scheduled_date: string
  status: string
  stripe_subscription_id: string | null
  metadata: Record<string, any>
}

/**
 * Execute a scheduled downgrade
 * Returns true if executed, false if file selection is needed
 */
export async function executeScheduledDowngrade(changeId: string): Promise<{
  success: boolean
  requiresFileSelection?: boolean
  currentFiles?: any[]
  maxFilesAllowed?: number
}> {
  try {
    // Get scheduled change details
    const { data: scheduledChange, error: changeError } = await supabase
      .from('scheduled_plan_changes')
      .select('*, target_plan:subscription_plans!target_plan_id(*)')
      .eq('id', changeId)
      .eq('status', 'pending')
      .single()

    if (changeError || !scheduledChange) {
      console.error('Scheduled change not found:', changeError)
      return { success: false }
    }

    const change = scheduledChange as ScheduledChange & { target_plan: any }

    // Get current files
    const filesWithCounts = await getFilesWithQnACounts(change.user_id)

    // Check if file selection is needed
    if (filesWithCounts.length > change.target_plan.max_files) {
      console.log(`File selection needed: ${filesWithCounts.length} files > ${change.target_plan.max_files} allowed`)
      return {
        success: false,
        requiresFileSelection: true,
        currentFiles: filesWithCounts,
        maxFilesAllowed: change.target_plan.max_files
      }
    }

    // No file selection needed, execute immediately
    await executeDowngradeInternal(change, [])

    return { success: true }
  } catch (error) {
    console.error('Error executing scheduled downgrade:', error)
    return { success: false }
  }
}

/**
 * Execute downgrade with file selection
 */
export async function executeDowngradeWithFiles(
  changeId: string,
  keepFileIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get scheduled change details
    const { data: scheduledChange, error: changeError } = await supabase
      .from('scheduled_plan_changes')
      .select('*, target_plan:subscription_plans!target_plan_id(*)')
      .eq('id', changeId)
      .eq('status', 'pending')
      .single()

    if (changeError || !scheduledChange) {
      return { success: false, error: 'Scheduled change not found' }
    }

    const change = scheduledChange as ScheduledChange & { target_plan: any }

    // Validate file selection
    if (keepFileIds.length !== change.target_plan.max_files) {
      return {
        success: false,
        error: `Please select exactly ${change.target_plan.max_files} files to keep`
      }
    }

    // Execute downgrade with file deactivation
    await executeDowngradeInternal(change, keepFileIds)

    return { success: true }
  } catch (error) {
    console.error('Error executing downgrade with files:', error)
    return { success: false, error: 'Failed to execute downgrade' }
  }
}

/**
 * Internal function to execute the downgrade
 */
async function executeDowngradeInternal(
  change: ScheduledChange & { target_plan: any },
  keepFileIds: string[]
) {
  // Get all user files
  const filesWithCounts = await getFilesWithQnACounts(change.user_id)

  // Deactivate files that are not in keepFileIds (if file selection was needed)
  if (keepFileIds.length > 0) {
    const filesToDeactivate = filesWithCounts
      .filter(f => !keepFileIds.includes(f.fileId))
      .map(f => f.fileId)

    if (filesToDeactivate.length > 0) {
      // Mark files as inactive by prefixing description
      for (const fileId of filesToDeactivate) {
        const { data: file } = await supabase
          .from('qna_collections')
          .select('description')
          .eq('id', fileId)
          .single()

        const currentDesc = file?.description || 'Deactivated due to plan downgrade'
        const newDesc = currentDesc.startsWith('[INACTIVE]')
          ? currentDesc
          : `[INACTIVE] ${currentDesc}`

        await supabase
          .from('qna_collections')
          .update({ description: newDesc })
          .eq('id', fileId)
          .eq('user_id', change.user_id)
      }
    }
  }

  // Update user subscription to target plan
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      plan_id: change.target_plan.id,
      stripe_subscription_id: null, // Clear Stripe subscription (downgraded to Free or cancelled)
      status: 'active',
      pending_plan_change_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', change.user_id)

  if (updateError) {
    throw new Error(`Failed to update subscription: ${updateError.message}`)
  }

  // Mark scheduled change as completed
  await supabase
    .from('scheduled_plan_changes')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', change.id)

  // Reset monthly question counter
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  await supabase
    .from('usage_tracking')
    .upsert({
      user_id: change.user_id,
      month_year: currentMonth,
      questions_used: 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,month_year'
    })

  console.log(`✅ Downgrade completed for user ${change.user_id} to plan ${change.target_plan.name}`)
}

/**
 * Check for pending downgrades that are ready to execute
 */
export async function checkPendingDowngrades(): Promise<string[]> {
  const now = new Date().toISOString()

  const { data: pendingDowngrades, error } = await supabase
    .from('scheduled_plan_changes')
    .select('id')
    .eq('status', 'pending')
    .eq('change_type', 'downgrade')
    .lte('scheduled_date', now)

  if (error) {
    console.error('Error checking pending downgrades:', error)
    return []
  }

  return pendingDowngrades?.map(d => d.id) || []
}
