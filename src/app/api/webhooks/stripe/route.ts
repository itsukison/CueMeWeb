import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for webhook operations')
}

// Use service role key for webhook operations to bypass RLS
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log('Received Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.client_reference_id || session.metadata?.userId
    
    if (!userId) {
      console.error('No user ID found in checkout session')
      return
    }

    // Get the subscription from Stripe
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      await createOrUpdateSubscription(subscription, userId)
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Handling subscription created:', subscription.id)
    console.log('Subscription metadata:', subscription.metadata)
    
    // Get user ID from subscription metadata
    const userId = subscription.metadata?.userId
    
    if (!userId) {
      console.error('No user ID found in subscription metadata:', subscription.metadata)
      return
    }

    console.log('Creating/updating subscription for user:', userId)
    await createOrUpdateSubscription(subscription, userId)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Find existing subscription by Stripe ID
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (existingSubscription) {
      await createOrUpdateSubscription(subscription, existingSubscription.user_id)
    }

    // Check if subscription is being cancelled (downgrade scheduled)
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subWithPeriod = subscription as any
      console.log('Downgrade scheduled for:', new Date(subWithPeriod.current_period_end * 1000))
    }

    // Check if subscription just ended (execute downgrade)
    if (subscription.status === 'canceled' || subscription.ended_at) {
      console.log('Subscription ended, checking for pending downgrade')
      
      // Find pending downgrade for this subscription
      const { data: scheduledChange } = await supabase
        .from('scheduled_plan_changes')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .eq('status', 'pending')
        .eq('change_type', 'downgrade')
        .maybeSingle()

      if (scheduledChange) {
        console.log('Executing scheduled downgrade:', scheduledChange.id)
        // Import and execute the downgrade
        const { executeScheduledDowngrade } = await import('@/lib/downgrade-executor')
        const result = await executeScheduledDowngrade(scheduledChange.id)
        
        if (result.requiresFileSelection) {
          console.log('Downgrade requires file selection, waiting for user action')
          // User will need to select files when they log in
        } else if (result.success) {
          console.log('Downgrade executed successfully')
        } else {
          console.error('Failed to execute downgrade')
        }
      }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Downgrade user to free plan
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'Free')
      .single()

    if (freePlan) {
      await supabase
        .from('user_subscriptions')
        .update({
          plan_id: freePlan.id,
          stripe_subscription_id: null,
          status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Cast to access subscription property which exists but might not be in type definition
    const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
    const subscription = invoiceWithSub.subscription
    if (subscription && typeof subscription === 'string') {
      const subscriptionData = await stripe.subscriptions.retrieve(subscription)
      
      // Update subscription status to active
      // Use type assertion for period properties which exist at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subWithPeriod = subscriptionData as any
      
      // Safely convert Unix timestamps
      const periodStart = subWithPeriod.current_period_start 
        ? new Date(subWithPeriod.current_period_start * 1000).toISOString()
        : new Date().toISOString()
      const periodEnd = subWithPeriod.current_period_end
        ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
        })
        .eq('stripe_subscription_id', subscriptionData.id)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Cast to access subscription property which exists but might not be in type definition
    const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
    const subscription = invoiceWithSub.subscription
    if (subscription && typeof subscription === 'string') {
      // Update subscription status to past_due
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscription)
    }
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function createOrUpdateSubscription(subscription: Stripe.Subscription, userId: string) {
  try {
    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price?.id
    
    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    // Find our plan by Stripe price ID
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .eq('stripe_price_id', priceId)
      .single()

    if (!plan) {
      console.error('Plan not found for price ID:', priceId)
      return
    }

    console.log(`Mapping subscription ${subscription.id} to plan: ${plan.name}`)

    // Get period dates from subscription items (which have the period info)
    const subscriptionItem = subscription.items.data[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemWithPeriod = subscriptionItem as any
    
    // Safely convert Unix timestamps to ISO strings
    let periodStart: string
    let periodEnd: string
    
    try {
      periodStart = itemWithPeriod.current_period_start 
        ? new Date(itemWithPeriod.current_period_start * 1000).toISOString()
        : new Date().toISOString()
      periodEnd = itemWithPeriod.current_period_end
        ? new Date(itemWithPeriod.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } catch (dateError) {
      console.error('Error converting dates:', dateError)
      console.error('Period values:', {
        start: itemWithPeriod.current_period_start,
        end: itemWithPeriod.current_period_end
      })
      // Use defaults if date conversion fails
      periodStart = new Date().toISOString()
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    console.log('Upserting subscription with data:', {
      userId,
      planId: plan.id,
      planName: plan.name,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      periodStart,
      periodEnd
    })
    
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error upserting subscription:', error)
      console.error('Failed subscription data:', {
        userId,
        planId: plan.id,
        planName: plan.name,
        stripeSubscriptionId: subscription.id,
        status: subscription.status
      })
      throw error // Throw to ensure webhook returns 500 and Stripe retries
    }

    console.log(`✅ Successfully updated subscription ${subscription.id} for user ${userId} to plan ${plan.name}`)
  } catch (error) {
    console.error('Error creating/updating subscription:', error)
    throw error // Re-throw to ensure webhook returns error status
  }
}