import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, stripe } from '@/lib/stripe'
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
    const { planName } = await request.json()

    if (!planName) {
      return NextResponse.json(
        { error: 'Plan name is required' },
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

    // Get the target plan details
    const { data: targetPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, stripe_price_id, name, price_jpy')
      .eq('name', planName)
      .single()

    if (planError || !targetPlan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Free plans don't need Stripe checkout
    if (targetPlan.price_jpy === 0 || !targetPlan.stripe_price_id) {
      return NextResponse.json(
        { error: 'Free plan does not require checkout' },
        { status: 400 }
      )
    }

    // Get current subscription
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, plan_id, subscription_plans(price_jpy, name)')
      .eq('user_id', user.id)
      .single()

    // Cancel any pending downgrades
    const { data: pendingDowngrade } = await supabase
      .from('scheduled_plan_changes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('change_type', 'downgrade')
      .maybeSingle()

    if (pendingDowngrade) {
      console.log('Cancelling pending downgrade:', pendingDowngrade.id)
      
      // Cancel the scheduled change
      await supabase
        .from('scheduled_plan_changes')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', pendingDowngrade.id)
      
      // Remove cancel_at_period_end from Stripe if set
      if (pendingDowngrade.stripe_subscription_id) {
        await stripe.subscriptions.update(pendingDowngrade.stripe_subscription_id, {
          cancel_at_period_end: false
        })
      }

      // Clear pending_plan_change_id from user_subscriptions
      await supabase
        .from('user_subscriptions')
        .update({ pending_plan_change_id: null })
        .eq('user_id', user.id)
    }

    // Check if this is an upgrade from existing paid plan
    const currentPlan = Array.isArray(currentSub?.subscription_plans) 
      ? currentSub.subscription_plans[0] 
      : currentSub?.subscription_plans
    if (currentSub?.stripe_subscription_id && currentPlan && currentPlan.price_jpy > 0) {
      console.log('Upgrading existing subscription:', currentSub.stripe_subscription_id)
      
      // Get the subscription from Stripe to find the current item
      const subscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)
      
      // Update the subscription with new price and restart billing cycle
      const updatedSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: targetPlan.stripe_price_id,
        }],
        proration_behavior: 'always_invoice', // Charge immediately
        billing_cycle_anchor: 'now', // Restart billing cycle
      })

      // Use type assertion for period properties which exist at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subWithPeriod = updatedSubscription as any

      // Update our database immediately
      await supabase
        .from('user_subscriptions')
        .update({
          plan_id: targetPlan.id,
          current_period_start: new Date(subWithPeriod.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subWithPeriod.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      return NextResponse.json({ 
        success: true,
        upgraded: true,
        message: 'Subscription upgraded successfully',
        redirectUrl: '/dashboard/subscription?upgraded=true'
      })
    }

    // For new subscriptions or upgrades from Free, create checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const successUrl = `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/dashboard/subscription/cancel`

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: targetPlan.stripe_price_id,
      userId: user.id,
      userEmail: user.email,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}