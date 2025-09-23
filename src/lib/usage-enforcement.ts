import { supabase } from '@/lib/supabase'

export interface SubscriptionLimits {
  maxFiles: number // Keep for backward compatibility during transition
  maxQnasPerFile: number // Keep for backward compatibility during transition
  maxMonthlyQuestions: number
  maxTotalQnaPairs: number // New global limit
  maxTotalDocumentScans: number // New global limit
}

export interface CurrentUsage {
  files: number
  questionsThisMonth: number
  totalQnaPairs: number // New global usage
  totalDocumentScans: number // New global usage
}

export interface FileQnACount {
  fileId: string
  fileName: string
  qnaCount: number
}

// Client-side functions that use API endpoints
export const clientUsageEnforcement = {
  // Check if user can create a new file (client-side) - Now unlimited!
  async canCreateFile(): Promise<{ allowed: boolean; reason?: string }> {
    // Files are now unlimited, so always allow creation
    return { allowed: true }
  },

  // Check if user can add a QnA pair (client-side) - Now global limit
  async canAddQnAToFile(fileId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { allowed: false, reason: 'Authentication required' }
      }

      // Get subscription limits
      const response = await fetch('/api/subscriptions/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }

      const data = await response.json()
      const maxTotalQnaPairs = data.subscription.subscription_plans.max_total_qna_pairs
      const currentTotalQnaPairs = data.current_usage.totalQnaPairs || 0

      if (currentTotalQnaPairs >= maxTotalQnaPairs) {
        return {
          allowed: false,
          reason: `Total QnA limit exceeded. Your plan allows ${maxTotalQnaPairs} QnA pairs total, you currently have ${currentTotalQnaPairs}.`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking QnA creation limits:', error)
      return { allowed: false, reason: 'Unable to verify subscription limits' }
    }
  },

  // Check if user can scan a document (client-side) - New function
  async canScanDocument(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { allowed: false, reason: 'Authentication required' }
      }

      // Get subscription limits
      const response = await fetch('/api/subscriptions/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }

      const data = await response.json()
      const maxTotalDocumentScans = data.subscription.subscription_plans.max_total_document_scans
      const currentTotalDocumentScans = data.current_usage.totalDocumentScans || 0

      if (currentTotalDocumentScans >= maxTotalDocumentScans) {
        return {
          allowed: false,
          reason: `Document scan limit exceeded. Your plan allows ${maxTotalDocumentScans} document scans total, you currently have ${currentTotalDocumentScans}.`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking document scan limits:', error)
      return { allowed: false, reason: 'Unable to verify subscription limits' }
    }
  }
}

// Server-side functions for API routes (keep existing implementation)

// Get user's subscription limits
export async function getUserSubscriptionLimits(userId: string): Promise<SubscriptionLimits | null> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans!inner (
          max_files,
          max_qnas_per_file,
          max_monthly_questions,
          max_total_qna_pairs,
          max_total_document_scans
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !subscription) {
      console.error('Error fetching subscription limits:', error)
      return null
    }

    const plans = subscription.subscription_plans as {
      max_files: number;
      max_qnas_per_file: number;
      max_monthly_questions: number;
      max_total_qna_pairs: number;
      max_total_document_scans: number;
    }[]
    const plan = plans?.[0]
    if (!plan) return null

    return {
      maxFiles: plan.max_files, // Keep for backward compatibility
      maxQnasPerFile: plan.max_qnas_per_file, // Keep for backward compatibility
      maxMonthlyQuestions: plan.max_monthly_questions,
      maxTotalQnaPairs: plan.max_total_qna_pairs,
      maxTotalDocumentScans: plan.max_total_document_scans,
    }
  } catch (error) {
    console.error('Error in getUserSubscriptionLimits:', error)
    return null
  }
}

// Get user's current usage
export async function getCurrentUsage(userId: string): Promise<CurrentUsage> {
  try {
    // Get file count
    const { count: fileCount } = await supabase
      .from('qna_collections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Get total QnA pairs across all collections
    const { count: totalQnaPairs } = await supabase
      .from('qna_items')
      .select('*, qna_collections!inner(user_id)', { count: 'exact' })
      .eq('qna_collections.user_id', userId)

    // Get total document scans across all collections
    const { count: totalDocumentScans } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')

    // Get current month usage
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('questions_used, total_qna_pairs_used, total_document_scans_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    return {
      files: fileCount || 0,
      questionsThisMonth: usage?.questions_used || 0,
      totalQnaPairs: totalQnaPairs || 0,
      totalDocumentScans: totalDocumentScans || 0,
    }
  } catch (error) {
    console.error('Error in getCurrentUsage:', error)
    return { 
      files: 0, 
      questionsThisMonth: 0,
      totalQnaPairs: 0,
      totalDocumentScans: 0
    }
  }
}

// Get QnA count for a specific file
export async function getFileQnACount(fileId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('qna_items')
      .select('*', { count: 'exact' })
      .eq('collection_id', fileId)

    return count || 0
  } catch (error) {
    console.error('Error in getFileQnACount:', error)
    return 0
  }
}

// Check if user can create a new file - Now unlimited!
export async function canCreateFile(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  // Files are now unlimited, so always allow creation
  return { allowed: true }
}

// Check if user can add a QnA pair - Now global limit
export async function canAddQnAToFile(userId: string, fileId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserSubscriptionLimits(userId)
  if (!limits) {
    return { allowed: false, reason: 'Unable to fetch subscription limits' }
  }

  const usage = await getCurrentUsage(userId)
  
  if (usage.totalQnaPairs >= limits.maxTotalQnaPairs) {
    return { 
      allowed: false, 
      reason: `Total QnA limit exceeded. Your plan allows ${limits.maxTotalQnaPairs} QnA pairs total, you currently have ${usage.totalQnaPairs}.` 
    }
  }

  return { allowed: true }
}

// Check if user can scan a document - New function
export async function canScanDocument(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserSubscriptionLimits(userId)
  if (!limits) {
    return { allowed: false, reason: 'Unable to fetch subscription limits' }
  }

  const usage = await getCurrentUsage(userId)
  
  if (usage.totalDocumentScans >= limits.maxTotalDocumentScans) {
    return { 
      allowed: false, 
      reason: `Document scan limit exceeded. Your plan allows ${limits.maxTotalDocumentScans} document scans total, you currently have ${usage.totalDocumentScans}.` 
    }
  }

  return { allowed: true }
}

// Check if user can ask a question (for electron app)
export async function canAskQuestion(userId: string): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const limits = await getUserSubscriptionLimits(userId)
  if (!limits) {
    return { allowed: false, reason: 'Unable to fetch subscription limits' }
  }

  const usage = await getCurrentUsage(userId)
  
  if (usage.questionsThisMonth >= limits.maxMonthlyQuestions) {
    return { 
      allowed: false, 
      reason: `Monthly question limit exceeded. Your plan allows ${limits.maxMonthlyQuestions} questions per month, you have used ${usage.questionsThisMonth}.` 
    }
  }

  return { 
    allowed: true,
    remaining: limits.maxMonthlyQuestions - usage.questionsThisMonth
  }
}

// Get all files with their QnA counts (for downgrade flow)
export async function getFilesWithQnACounts(userId: string): Promise<FileQnACount[]> {
  try {
    const { data: files } = await supabase
      .from('qna_collections')
      .select(`
        id,
        name,
        qna_items(count)
      `)
      .eq('user_id', userId)

    return files?.map(file => ({
      fileId: file.id,
      fileName: file.name,
      qnaCount: file.qna_items?.[0]?.count || 0
    })) || []
  } catch (error) {
    console.error('Error in getFilesWithQnACounts:', error)
    return []
  }
}