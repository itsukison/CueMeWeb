import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get user's subscription with plan details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          price_jpy,
          max_files,
          max_qnas_per_file,
          max_monthly_questions
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (subError) {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // Get current month usage
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('questions_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    // Get current file count
    const { count: fileCount } = await supabase
      .from('qna_collections')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Get QnA count per file
    const { data: filesWithCounts } = await supabase
      .from('qna_collections')
      .select(`
        id,
        name,
        qna_items(count)
      `)
      .eq('user_id', user.id)

    const filesQnaCounts = filesWithCounts?.map(file => ({
      id: file.id,
      name: file.name,
      qna_count: file.qna_items?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      subscription,
      usage: {
        questions_used: usage?.questions_used || 0,
        current_month: monthYear,
      },
      current_usage: {
        files: fileCount || 0,
        files_with_counts: filesQnaCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}