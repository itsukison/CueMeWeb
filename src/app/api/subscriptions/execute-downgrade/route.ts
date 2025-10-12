import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { executeScheduledDowngrade, executeDowngradeWithFiles } from '@/lib/downgrade-executor'

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
    const { changeId, keepFileIds } = await request.json()

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

    // If no changeId provided, find the user's pending downgrade
    let targetChangeId = changeId
    if (!targetChangeId) {
      const { data: pendingChange } = await supabase
        .from('scheduled_plan_changes')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('change_type', 'downgrade')
        .maybeSingle()

      if (!pendingChange) {
        return NextResponse.json(
          { error: 'No pending downgrade found' },
          { status: 404 }
        )
      }

      targetChangeId = pendingChange.id
    }

    // Verify the change belongs to this user
    const { data: scheduledChange } = await supabase
      .from('scheduled_plan_changes')
      .select('user_id')
      .eq('id', targetChangeId)
      .single()

    if (!scheduledChange || scheduledChange.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Execute downgrade
    let result
    if (keepFileIds && keepFileIds.length > 0) {
      // Execute with file selection
      result = await executeDowngradeWithFiles(targetChangeId, keepFileIds)
    } else {
      // Try to execute without file selection
      result = await executeScheduledDowngrade(targetChangeId)
    }

    if (!result.success) {
      if ('requiresFileSelection' in result && result.requiresFileSelection) {
        return NextResponse.json({
          requiresFileSelection: true,
          currentFiles: result.currentFiles,
          maxFilesAllowed: result.maxFilesAllowed,
          message: `Please select ${result.maxFilesAllowed} files to keep`
        })
      }

      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Failed to execute downgrade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Downgrade completed successfully'
    })
  } catch (error) {
    console.error('Error in execute-downgrade endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to execute downgrade' },
      { status: 500 }
    )
  }
}
