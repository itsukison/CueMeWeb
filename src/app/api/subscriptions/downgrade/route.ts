import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getFilesWithQnACounts } from '@/lib/usage-enforcement'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { targetPlanName, keepFileIds } = await request.json()

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

    // Get current usage
    const filesWithCounts = await getFilesWithQnACounts(user.id)
    
    // Check if downgrade is possible
    if (filesWithCounts.length > targetPlan.max_files) {
      if (!keepFileIds || keepFileIds.length !== targetPlan.max_files) {
        return NextResponse.json({
          requiresFileSelection: true,
          currentFiles: filesWithCounts,
          maxFilesAllowed: targetPlan.max_files,
          message: `You have ${filesWithCounts.length} files but the ${targetPlanName} plan only allows ${targetPlan.max_files}. Please select ${targetPlan.max_files} files to keep active.`
        })
      }

      // Validate selected files
      if (keepFileIds.length !== targetPlan.max_files) {
        return NextResponse.json(
          { error: `Please select exactly ${targetPlan.max_files} files to keep` },
          { status: 400 }
        )
      }

      // Deactivate unselected files (we'll add a status column later)
      // For now, we'll just mark them in a way that they're not shown in normal queries
      const allFileIds = filesWithCounts.map(f => f.fileId)
      const filesToDeactivate = allFileIds.filter(id => !keepFileIds.includes(id))
      
      // Add an "inactive" description prefix to deactivated files
      for (const fileId of filesToDeactivate) {
        await supabase
          .from('qna_collections')
          .update({ 
            description: `[INACTIVE] ${await getFileDescription(fileId) || 'Deactivated due to plan downgrade'}`
          })
          .eq('id', fileId)
          .eq('user_id', user.id)
      }
    }

    // Check QnA limits for remaining files
    const remainingFiles = keepFileIds ? 
      filesWithCounts.filter(f => keepFileIds.includes(f.fileId)) : 
      filesWithCounts.slice(0, targetPlan.max_files)

    const filesExceedingQnALimit = remainingFiles.filter(f => f.qnaCount > targetPlan.max_qnas_per_file)
    
    if (filesExceedingQnALimit.length > 0) {
      return NextResponse.json({
        requiresQnAReduction: true,
        filesExceedingLimit: filesExceedingQnALimit,
        maxQnAsPerFile: targetPlan.max_qnas_per_file,
        message: `Some files exceed the QnA limit for the ${targetPlanName} plan (${targetPlan.max_qnas_per_file} per file). Please reduce QnAs in these files.`
      })
    }

    // Update user subscription to target plan
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ plan_id: targetPlan.id })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully downgraded to ${targetPlanName} plan`
    })
  } catch (error) {
    console.error('Error in downgrade endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process downgrade' },
      { status: 500 }
    )
  }
}

async function getFileDescription(fileId: string): Promise<string | null> {
  const { data } = await supabase
    .from('qna_collections')
    .select('description')
    .eq('id', fileId)
    .single()
  
  return data?.description || null
}