import { NextRequest, NextResponse } from 'next/server'
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

    // Find pending downgrade
    const { data: pendingDowngrade } = await supabase
      .from('scheduled_plan_changes')
      .select('*, target_plan:subscription_plans!target_plan_id(*)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('change_type', 'downgrade')
      .maybeSingle()

    return NextResponse.json({
      pendingDowngrade: pendingDowngrade || null
    })
  } catch (error) {
    console.error('Error fetching pending downgrade:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending downgrade' },
      { status: 500 }
    )
  }
}
