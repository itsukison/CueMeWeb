import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { targetPlanName } = await request.json()

    if (!targetPlanName) {
      return NextResponse.json(
        { error: 'Target plan name is required' },
        { status: 400 }
      )
    }

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

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans!inner(id, name, price_jpy)')
      .eq('user_id', user.id)
      .single()

    if (subError || !currentSub) {
      return NextResponse.json(
        { error: 'Current subscription not found' },
        { status: 404 }
      )
    }

    // Get target plan details
    const { data: targetPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', targetPlanName)
      .single()

    if (planError || !targetPlan) {
      return NextResponse.json(
        { error: 'Target plan not found' },
        { status: 404 }
      )
    }

    // Validate this is actually a downgrade
    if (targetPlan.price_jpy >= currentSub.subscription_plans.price_jpy) {
      return NextResponse.json(
        { error: 'Target plan must be lower tier than current plan' },
        { status: 400 }
      )
    }

    // Check if there's already a pending downgrade
    const { data: existingDowngrade } = await supabase
      .from('scheduled_plan_changes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingDowngrade) {
      return NextResponse.json(
        { error: 'You already have a pending plan change. Please cancel it first.' },
        { status: 400 }
      )
    }

    let scheduledDate: Date
    let stripeSubscriptionId = currentSub.stripe_subscription_id

    // If user has a Stripe subscription, get the period end date
    if (stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      scheduledDate = new Date(subscription.current_period_end * 1000)

      // Update Stripe subscription to cancel at period end
      await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      })
    } else {
      // For Free plan users (shouldn't happen, but handle it)
      scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }

    // Create scheduled plan change
    const { data: scheduledChange, error: scheduleError } = await supabase
      .from('scheduled_plan_changes')
      .insert({
        user_id: user.id,
        current_plan_id: currentSub.plan_id,
        target_plan_id: targetPlan.id,
        change_type: 'downgrade',
        scheduled_date: scheduledDate.toISOString(),
        status: 'pending',
        stripe_subscription_id: stripeSubscriptionId,
        metadata: {}
      })
      .select()
      .single()

    if (scheduleError || !scheduledChange) {
      console.error('Error creating scheduled change:', scheduleError)
      return NextResponse.json(
        { error: 'Failed to schedule downgrade' },
        { status: 500 }
      )
    }

    // Link scheduled change to user subscription
    await supabase
      .from('user_subscriptions')
      .update({ pending_plan_change_id: scheduledChange.id })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      scheduledDate: scheduledDate.toISOString(),
      targetPlan: targetPlan.name,
      message: `Downgrade to ${targetPlan.name} scheduled for ${scheduledDate.toLocaleDateString()}`
    })
  } catch (error) {
    console.error('Error scheduling downgrade:', error)
    return NextResponse.json(
      { error: 'Failed to schedule downgrade' },
      { status: 500 }
    )
  }
}
