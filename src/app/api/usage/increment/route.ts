import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    console.log('[API] Usage increment request started')
    
    // Parse request body for type and count parameters
    let requestBody: { type?: string; count?: number } = {}
    try {
      requestBody = await request.json()
    } catch (e) {
      // If no body or invalid JSON, default to questions with count: 1
      console.log('[API] No request body, defaulting to questions count: 1')
    }
    
    const type = requestBody.type || 'questions'
    const count = requestBody.count || 1
    console.log('[API] Increment type:', type, 'count:', count)
    
    // Get the authenticated user
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    console.log('[API] Auth header present:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[API] Missing or invalid auth header')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[API] Token extracted, length:', token.length)
    
    // Create supabase client with proper JWT context for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })
    
    console.log('[API] Supabase client created')
    
    // Verify the user and set the session context
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    console.log('[API] User verification result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    if (authError || !user) {
      console.log('[API] Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get current month-year
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    console.log('[API] Month-year calculated:', monthYear)

    // Check user's current plan limits
    console.log('[API] Querying user subscription for user:', user.id)
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          max_monthly_questions,
          max_total_qna_pairs,
          max_total_document_scans
        )
      `)
      .eq('user_id', user.id)
      .single()

    console.log('[API] Subscription query result:', { 
      hasSubscription: !!subscription, 
      subError: subError?.message,
      subscriptionData: subscription 
    })

    if (subError) {
      console.log('[API] Subscription query error:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription: ' + subError.message },
        { status: 500 }
      )
    }

    if (!subscription) {
      console.log('[API] No subscription found for user')
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const plans = subscription.subscription_plans as any
    const maxQuestions = plans?.max_monthly_questions || 10
    const maxQnaPairs = plans?.max_total_qna_pairs || 10
    const maxDocumentScans = plans?.max_total_document_scans || 3
    console.log('[API] Limits from plan:', { maxQuestions, maxQnaPairs, maxDocumentScans })

    // Get or create current month usage
    console.log('[API] Querying current usage for user:', user.id, 'month:', monthYear)
    const { data: currentUsage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('questions_used, total_qna_pairs_used, total_document_scans_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    console.log('[API] Usage query result:', { 
      hasUsage: !!currentUsage, 
      usageError: usageError?.message,
      currentUsage 
    })

    const currentQuestions = currentUsage?.questions_used || 0
    const currentQnaPairs = currentUsage?.total_qna_pairs_used || 0
    const currentDocumentScans = currentUsage?.total_document_scans_used || 0
    console.log('[API] Current usage:', { currentQuestions, currentQnaPairs, currentDocumentScans })

    // Check limits based on type
    let updateData: any = {
      user_id: user.id,
      month_year: monthYear,
      questions_used: currentQuestions,
      total_qna_pairs_used: currentQnaPairs,
      total_document_scans_used: currentDocumentScans,
    }

    if (type === 'questions') {
      // Only check limits for positive counts (increments)
      if (count > 0 && currentQuestions + count > maxQuestions) {
        console.log('[API] Question limit would be exceeded:', { currentQuestions, count, maxQuestions })
        return NextResponse.json(
          { 
            error: 'Monthly question limit would be exceeded',
            limit: maxQuestions,
            used: currentQuestions,
            requested: count,
            remaining: maxQuestions - currentQuestions
          },
          { status: 429 }
        )
      }
      updateData.questions_used = Math.max(0, currentQuestions + count)
    } else if (type === 'qna_pairs') {
      // Only check limits for positive counts (increments)
      if (count > 0 && currentQnaPairs + count > maxQnaPairs) {
        console.log('[API] QnA pairs limit would be exceeded:', { currentQnaPairs, count, maxQnaPairs })
        return NextResponse.json(
          { 
            error: 'Total QnA pairs limit would be exceeded',
            limit: maxQnaPairs,
            used: currentQnaPairs,
            requested: count,
            remaining: maxQnaPairs - currentQnaPairs
          },
          { status: 429 }
        )
      }
      updateData.total_qna_pairs_used = Math.max(0, currentQnaPairs + count)
    } else if (type === 'document_scans') {
      // Only check limits for positive counts (increments)
      if (count > 0 && currentDocumentScans + count > maxDocumentScans) {
        console.log('[API] Document scans limit would be exceeded:', { currentDocumentScans, count, maxDocumentScans })
        return NextResponse.json(
          { 
            error: 'Total document scans limit would be exceeded',
            limit: maxDocumentScans,
            used: currentDocumentScans,
            requested: count,
            remaining: maxDocumentScans - currentDocumentScans
          },
          { status: 429 }
        )
      }
      updateData.total_document_scans_used = Math.max(0, currentDocumentScans + count)
    } else {
      return NextResponse.json(
        { error: 'Invalid usage type. Must be: questions, qna_pairs, or document_scans' },
        { status: 400 }
      )
    }

    // Increment usage by count
    console.log('[API] Attempting to increment usage:', updateData)
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .upsert(updateData, {
        onConflict: 'user_id,month_year'
      })

    console.log('[API] Usage update result:', { 
      updateError: updateError?.message 
    })

    if (updateError) {
      console.error('[API] Error updating usage:', updateError)
      return NextResponse.json(
        { error: 'Failed to update usage: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[API] Usage update successful')
    const newUsed = type === 'questions' ? Math.max(0, currentQuestions + count) : 
                    type === 'qna_pairs' ? Math.max(0, currentQnaPairs + count) :
                    Math.max(0, currentDocumentScans + count);
    
    const limit = type === 'questions' ? maxQuestions : 
                  type === 'qna_pairs' ? maxQnaPairs :
                  maxDocumentScans;

    return NextResponse.json({
      success: true,
      type,
      usage: {
        used: newUsed,
        limit: limit,
        remaining: limit - newUsed,
        changed: count
      }
    })
  } catch (error) {
    console.error('[API] Critical error in usage increment:', error)
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack available')
    return NextResponse.json(
      { error: 'Failed to increment usage: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}