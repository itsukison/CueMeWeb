import { supabase } from '@/lib/supabase'

/**
 * Ensures a usage tracking record exists for the given user and current month
 * This should be called whenever a user performs an action that needs usage tracking
 */
export async function ensureUsageTrackingExists(userId: string): Promise<void> {
  try {
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Check if usage record already exists
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    // If no record exists, create one
    if (!existing) {
      const { error: insertError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          questions_used: 0,
        })

      if (insertError) {
        console.error('Error creating usage tracking record:', insertError)
        // Don't throw - this is not critical for the main operation
      } else {
        console.log(`Created usage tracking record for user ${userId}, month ${monthYear}`)
      }
    }
  } catch (error) {
    console.error('Error ensuring usage tracking exists:', error)
    // Don't throw - this is not critical for the main operation
  }
}

/**
 * Client-side function to ensure usage tracking via API call
 * This can be called from React components when needed
 */
export async function ensureUsageTrackingExistsClient(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Make a request to the subscription API which will initialize usage tracking
    await fetch('/api/subscriptions/user', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
  } catch (error) {
    console.error('Error ensuring usage tracking exists (client):', error)
  }
}