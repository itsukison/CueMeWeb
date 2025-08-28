import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you might want to add authentication)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentDate = new Date()
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    console.log(`Starting usage reset for month: ${currentMonthYear}`)

    // Get all users who have usage records from previous months
    const { data: usersWithUsage, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('user_id')
      .neq('month_year', currentMonthYear)

    if (fetchError) {
      console.error('Error fetching users with usage:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      )
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithUsage?.map(record => record.user_id) || [])]

    let resetCount = 0
    let errorCount = 0

    // Create new usage records for current month for all users (with 0 usage)
    for (const userId of uniqueUserIds) {
      try {
        const { error: upsertError } = await supabase
          .from('usage_tracking')
          .upsert({
            user_id: userId,
            month_year: currentMonthYear,
            questions_used: 0,
          }, {
            onConflict: 'user_id,month_year'
          })

        if (upsertError) {
          console.error(`Error resetting usage for user ${userId}:`, upsertError)
          errorCount++
        } else {
          resetCount++
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
        errorCount++
      }
    }

    // Optional: Clean up old usage records (keep last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const cleanupMonthYear = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}`

    const { error: cleanupError } = await supabase
      .from('usage_tracking')
      .delete()
      .lt('month_year', cleanupMonthYear)

    if (cleanupError) {
      console.error('Error cleaning up old usage records:', cleanupError)
    }

    console.log(`Usage reset completed. Reset: ${resetCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      month: currentMonthYear,
      usersProcessed: uniqueUserIds.length,
      resetCount,
      errorCount,
      message: `Successfully reset usage for ${resetCount} users for month ${currentMonthYear}`
    })
  } catch (error) {
    console.error('Error in usage reset:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    )
  }
}

// Allow GET for testing purposes (remove in production)
export async function GET() {
  return NextResponse.json({
    message: 'Usage reset endpoint is active. Use POST with proper authentication to reset usage.',
    currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  })
}