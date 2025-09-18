import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
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
    
    // Create supabase client with proper JWT context for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })
    
    // Verify the user and set the session context
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user's subscription with plan details
    let { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          price_jpy,
          max_files,
          max_qna_files,
          max_scanned_documents,
          max_qnas_per_file,
          max_monthly_questions,
          max_total_qna_pairs,
          max_total_document_scans
        )
      `)
      .eq('user_id', user.id)
      .single()

    // If user doesn't have a subscription, create a free plan subscription
    if (subError && subError.code === 'PGRST116') {
      // Get the free plan
      const { data: freePlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Free')
        .single()

      if (planError || !freePlan) {
        console.error('Error fetching free plan:', planError)
        return NextResponse.json(
          { error: 'Free plan not found' },
          { status: 500 }
        )
      }

      // Create a free subscription for the user
      const { data: newSubscription, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: freePlan.id,
          status: 'active'
        })
        .select(`
          *,
          subscription_plans (
            name,
            price_jpy,
            max_files,
            max_qna_files,
            max_scanned_documents,
            max_qnas_per_file,
            max_monthly_questions,
            max_total_qna_pairs,
            max_total_document_scans
          )
        `)
        .single()

      if (insertError) {
        console.error('Error creating subscription:', insertError)
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }

      if (newSubscription) {
        subscription = newSubscription
        subError = null
      }
    }
    
    if (subError) {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription available' },
        { status: 500 }
      )
    }

    // Get current month usage using authenticated client
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    let { data: usage } = await supabase
      .from('usage_tracking')
      .select('questions_used, qna_files_used, scanned_documents_used, total_qna_pairs_used, total_document_scans_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    // If no usage record exists for this month, create one
    if (!usage) {
      const { data: newUsage, error: insertUsageError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          month_year: monthYear,
          questions_used: 0,
          qna_files_used: 0,
          scanned_documents_used: 0,
          total_qna_pairs_used: 0,
          total_document_scans_used: 0
        })
        .select('questions_used, qna_files_used, scanned_documents_used, total_qna_pairs_used, total_document_scans_used')
        .single()

      if (insertUsageError) {
        console.error('Error creating usage record:', insertUsageError)
        // Continue with default values rather than failing
        usage = { 
          questions_used: 0, 
          qna_files_used: 0, 
          scanned_documents_used: 0,
          total_qna_pairs_used: 0,
          total_document_scans_used: 0
        }
      } else {
        usage = newUsage
      }
    }

    // Get current file counts using authenticated client
    const { count: qnaCount } = await supabase
      .from('qna_collections')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    const { count: documentCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Get total QnA pairs across all collections
    const { count: totalQnaPairs } = await supabase
      .from('qna_items')
      .select('*, qna_collections!inner(user_id)', { count: 'exact' })
      .eq('qna_collections.user_id', user.id)

    // Get total document scans (completed documents)
    const totalDocumentScans = documentCount || 0

    return NextResponse.json({
      subscription,
      usage: {
        questions_used: usage?.questions_used || 0,
        qna_files_used: usage?.qna_files_used || 0,
        scanned_documents_used: usage?.scanned_documents_used || 0,
        current_month: monthYear,
      },
      current_usage: {
        qna_files: qnaCount || 0,
        documents: documentCount || 0,
        totalQnaPairs: totalQnaPairs || 0,
        totalDocumentScans: totalDocumentScans || 0,
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