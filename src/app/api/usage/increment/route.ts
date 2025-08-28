import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get current month-year
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Check user's current plan limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans (
          max_monthly_questions
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const maxQuestions = subscription.subscription_plans?.[0]?.max_monthly_questions || 10

    // Get or create current month usage
    const { data: currentUsage } = await supabase
      .from('usage_tracking')
      .select('questions_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    const currentQuestions = currentUsage?.questions_used || 0

    // Check if user would exceed limit
    if (currentQuestions >= maxQuestions) {
      return NextResponse.json(
        { 
          error: 'Monthly question limit exceeded',
          limit: maxQuestions,
          used: currentQuestions
        },
        { status: 429 }
      )
    }

    // Increment usage
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: user.id,
        month_year: monthYear,
        questions_used: currentQuestions + 1,
      })

    if (updateError) {
      console.error('Error updating usage:', updateError)
      return NextResponse.json(
        { error: 'Failed to update usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usage: {
        used: currentQuestions + 1,
        limit: maxQuestions,
        remaining: maxQuestions - (currentQuestions + 1)
      }
    })
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    )
  }
}