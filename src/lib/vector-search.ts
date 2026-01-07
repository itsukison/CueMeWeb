import { supabase } from './supabase'
import { generateNormalizedEmbedding } from './gemini-embeddings'

export interface SearchResult {
  id: string
  question: string
  answer: string
  tags: string[]
  similarity: number
}

export async function searchQnAItems(
  query: string,
  collectionId: string,
  matchThreshold: number = 0.8,
  matchCount: number = 5
): Promise<SearchResult[]> {
  try {
    // Generate Gemini embedding for the search query
    const queryEmbedding = await generateNormalizedEmbedding(query)
    
    // Use the Postgres function for vector similarity search
    const { data, error } = await supabase.rpc('search_qna_items', {
      query_embedding: queryEmbedding,
      collection_id_filter: collectionId,
      match_threshold: matchThreshold,
      match_count: matchCount
    })

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error searching QnA items:', error)
    throw error
  }
}

export async function findRelevantAnswers(
  question: string,
  collectionId: string,
  threshold: number = 0.7
): Promise<{
  hasRelevantAnswers: boolean
  answers: SearchResult[]
  bestMatch?: SearchResult
}> {
  try {
    const results = await searchQnAItems(question, collectionId, threshold, 3)
    
    const hasRelevantAnswers = results.length > 0
    const bestMatch = results.length > 0 ? results[0] : undefined
    
    return {
      hasRelevantAnswers,
      answers: results,
      bestMatch
    }
  } catch (error) {
    console.error('Error finding relevant answers:', error)
    return {
      hasRelevantAnswers: false,
      answers: []
    }
  }
}

// Function to format RAG context for AI responses
export function formatRAGContext(results: SearchResult[]): string {
  if (results.length === 0) return ''
  
  const context = results
    .map((result, index) => {
      return `Context ${index + 1} (similarity: ${result.similarity.toFixed(2)}):\nQ: ${result.question}\nA: ${result.answer}`
    })
    .join('\n\n---\n\n')
    
  return `Based on the following relevant information from your knowledge base:

${context}

Please provide a comprehensive answer:`
}