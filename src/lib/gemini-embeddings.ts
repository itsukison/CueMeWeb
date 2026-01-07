/**
 * Gemini Embeddings Service
 *
 * Provides text embedding generation using Gemini's text-embedding-004 model.
 * Used for manual Q&A pairs (not documents - those use File Search).
 *
 * Dimension: 768 (Gemini text-embedding-004)
 * Previous: 1536 (OpenAI text-embedding-3-large)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate embedding for text using Gemini
 *
 * @param text - The text to embed
 * @returns Array of 768 numbers representing the embedding
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for embedding generation');
    }

    // Use Gemini's text embedding model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // Generate embedding
    const result = await model.embedContent(text);

    // Return the embedding vector (768 dimensions)
    return result.embedding.values;
  } catch (error) {
    console.error('[GeminiEmbeddings] Error generating embedding:', error);
    throw new Error(`Failed to generate Gemini embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize Japanese text for better embedding quality
 *
 * @param text - The text to normalize
 * @returns Normalized text
 */
export function normalizeJapaneseText(text: string): string {
  return text
    // Normalize full-width to half-width numbers
    .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // Normalize full-width to half-width ASCII
    .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate embedding with Japanese text normalization
 *
 * @param text - The text to embed
 * @returns Array of 768 numbers representing the embedding
 */
export async function generateNormalizedEmbedding(text: string): Promise<number[]> {
  const normalizedText = normalizeJapaneseText(text);
  return generateGeminiEmbedding(normalizedText.replace(/\n/g, ' '));
}
