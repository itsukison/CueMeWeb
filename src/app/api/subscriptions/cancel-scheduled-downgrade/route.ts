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

    // Find pending downgrade
    const { data: pendingDowngrade, error: findError } = await supabase
      .from('scheduled_plan_changes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('change_type', 'downgrade')
      .maybeSingle()

    if (findError) {
      console.error('Error finding pending downgrade:', findError)
      return NextResponse.json(
        { error: 'Failed to find pending downgrade' },
        { status: 500 }
      )
    }

    if (!pendingDowngrade) {
      return NextResponse.json(
        { error: 'No pending downgrade found' },
        { status: 404 }
      )
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('scheduled_plan_changes')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingDowngrade.id)

    if (updateError) {
      console.error('Error cancelling downgrade:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel downgrade' },
        { status: 500 }
      )
    }

    // Remove cancel_at_period_end from Stripe subscription
    if (pendingDowngrade.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(pendingDowngrade.stripe_subscription_id, {
          cancel_at_period_end: false
        })
      } catch (stripeError) {
        console.error('Error updating Stripe subscription:', stripeError)
        // Continue anyway - the downgrade is cancelled in our system
      }
    }

    // Clear pending_plan_change_id from user_subscriptions
    await supabase
      .from('user_subscriptions')
      .update({ pending_plan_change_id: null })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Scheduled downgrade cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling scheduled downgrade:', error)
    return NextResponse.json(
      { error: 'Failed to cancel scheduled downgrade' },
      { status: 500 }
    )
  }
}
