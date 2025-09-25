import OpenAI from 'openai'
import { normalizeJapaneseText, extractKeyTerms } from './japanese-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate multilingual embeddings optimized for Japanese content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Normalize Japanese text for better embedding quality
    const normalizedText = normalizeJapaneseText(text)
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // Latest multilingual model
      input: normalizedText.replace(/\n/g, ' '),
      dimensions: 1536 // Optional: reduce dimensions for efficiency
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const normalizedTexts = texts.map(text => normalizeJapaneseText(text))
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: normalizedTexts,
      dimensions: 1536
    })
    
    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating batch embeddings:', error)
    throw new Error('Failed to generate batch embeddings')
  }
}

/**
 * Generate enhanced embeddings with key terms for better Japanese retrieval
 */
export async function generateEnhancedEmbedding(text: string, context?: string): Promise<{
  embedding: number[]
  keyTerms: string[]
  enhancedText: string
}> {
  try {
    const normalizedText = normalizeJapaneseText(text)
    const keyTerms = extractKeyTerms(normalizedText)
    
    // Create enhanced text with key terms for better retrieval
    const enhancedText = context 
      ? `${context}\n${normalizedText}\nキーワード: ${keyTerms.join(', ')}`
      : `${normalizedText}\nキーワード: ${keyTerms.join(', ')}`
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: enhancedText,
      dimensions: 1536
    })
    
    return {
      embedding: response.data[0].embedding,
      keyTerms,
      enhancedText
    }
  } catch (error) {
    console.error('Error generating enhanced embedding:', error)
    throw new Error('Failed to generate enhanced embedding')
  }
}

export { openai }