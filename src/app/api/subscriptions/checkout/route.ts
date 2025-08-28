import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

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

    // Get the price ID from Supabase plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('stripe_price_id')
      .eq('name', planName)
      .single()

    if (planError || !plan?.stripe_price_id) {
      return NextResponse.json(
        { error: 'Invalid plan or missing price ID' },
        { status: 400 }
      )
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const successUrl = `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/dashboard/subscription/cancel`

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: plan.stripe_price_id,
      userId: user.id,
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