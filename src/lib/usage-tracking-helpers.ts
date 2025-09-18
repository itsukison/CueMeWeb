import { supabase } from '@/lib/supabase'

// Server-side functions are moved to API endpoints
// These functions should only be called from server-side code

/**
 * Client-side function to track QnA creation (calls API endpoint)
 */
export async function trackQnACreation(count: number = 1): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/usage/increment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ 
        type: 'qna_pairs',
        count 
      })
    })
  } catch (error) {
    console.error('Error tracking QnA creation:', error)
  }
}

/**
 * Client-side function to track document scan (calls API endpoint)
 */
export async function trackDocumentScan(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/usage/increment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ 
        type: 'document_scans',
        count: 1 
      })
    })
  } catch (error) {
    console.error('Error tracking document scan:', error)
  }
}