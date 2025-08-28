import { supabase } from '@/lib/supabase'

export interface SubscriptionLimits {
  maxFiles: number
  maxQnasPerFile: number
  maxMonthlyQuestions: number
}

export interface CurrentUsage {
  files: number
  questionsThisMonth: number
}

export interface FileQnACount {
  fileId: string
  fileName: string
  qnaCount: number
}

// Get user's subscription limits
export async function getUserSubscriptionLimits(userId: string): Promise<SubscriptionLimits | null> {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans!inner (
          max_files,
          max_qnas_per_file,
          max_monthly_questions
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
    }[]
    const plan = plans?.[0]
    if (!plan) return null

    return {
      maxFiles: plan.max_files,
      maxQnasPerFile: plan.max_qnas_per_file,
      maxMonthlyQuestions: plan.max_monthly_questions,
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

    // Get current month usage
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('questions_used')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single()

    return {
      files: fileCount || 0,
      questionsThisMonth: usage?.questions_used || 0,
    }
  } catch (error) {
    console.error('Error in getCurrentUsage:', error)
    return { files: 0, questionsThisMonth: 0 }
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

// Check if user can create a new file
export async function canCreateFile(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserSubscriptionLimits(userId)
  if (!limits) {
    return { allowed: false, reason: 'Unable to fetch subscription limits' }
  }

  const usage = await getCurrentUsage(userId)
  
  if (usage.files >= limits.maxFiles) {
    return { 
      allowed: false, 
      reason: `File limit exceeded. Your plan allows ${limits.maxFiles} files, you currently have ${usage.files}.` 
    }
  }

  return { allowed: true }
}

// Check if user can add a QnA to a file
export async function canAddQnAToFile(userId: string, fileId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getUserSubscriptionLimits(userId)
  if (!limits) {
    return { allowed: false, reason: 'Unable to fetch subscription limits' }
  }

  const currentQnACount = await getFileQnACount(fileId)
  
  if (currentQnACount >= limits.maxQnasPerFile) {
    return { 
      allowed: false, 
      reason: `QnA limit per file exceeded. Your plan allows ${limits.maxQnasPerFile} QnAs per file, this file has ${currentQnACount}.` 
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