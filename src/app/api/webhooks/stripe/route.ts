import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

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
    // Get user ID from customer or metadata
    const userId = subscription.metadata?.userId
    
    if (!userId) {
      console.error('No user ID found in subscription metadata')
      return
    }

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
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription)
      
      // Update subscription status to active
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
      // Update subscription status to past_due
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', (invoice as any).subscription)
    }
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function createOrUpdateSubscription(subscription: Stripe.Subscription, userId: string) {
  try {
    // Determine plan based on subscription price
    const price = subscription.items.data[0]?.price
    let planName = 'Free'
    
    if (price) {
      // Map Stripe price to our plan names based on amount
      if (price.unit_amount === 750) {
        planName = 'Basic'
      } else if (price.unit_amount === 2500) {
        planName = 'Premium'
      }
    }

    // Get our plan ID
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planName)
      .single()

    if (!plan) {
      console.error('Plan not found:', planName)
      return
    }

    // Upsert user subscription
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status as any,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      })
      .eq('user_id', userId)

    console.log(`Subscription ${subscription.id} updated for user ${userId}`)
  } catch (error) {
    console.error('Error creating/updating subscription:', error)
  }
}