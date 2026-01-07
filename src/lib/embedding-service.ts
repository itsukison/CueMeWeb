/**
 * Embedding Service
 * 
 * Generates embeddings using Gemini text-embedding-004 model.
 * Used for both document chunks and query embeddings.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

/**
 * Normalize text for better embedding quality
 * Especially important for Japanese text
 */
function normalizeText(text: string): string {
    return text
        // Normalize full-width to half-width numbers
        .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
        // Normalize full-width to half-width ASCII
        .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
        // Replace newlines with spaces
        .replace(/\n/g, ' ')
        // Clean up excessive whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Generate embedding for a single text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required for embeddings');
    }

    const normalizedText = normalizeText(text);

    if (normalizedText.length === 0) {
        throw new Error('Cannot generate embedding for empty text');
    }

    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(normalizedText);

    return result.embedding.values;
}

/**
 * Generate embeddings for multiple text strings (batch)
 * Processes in parallel for efficiency
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`[EmbeddingService] Generating ${texts.length} embeddings...`);

    const embeddings = await Promise.all(
        texts.map(async (text, index) => {
            try {
                return await generateEmbedding(text);
            } catch (error) {
                console.error(`[EmbeddingService] Failed to generate embedding ${index}:`, error);
                throw error;
            }
        })
    );

    console.log(`[EmbeddingService] Generated ${embeddings.length} embeddings successfully`);
    return embeddings;
}

/**
 * Generate embedding for a query (same as regular embedding but with logging)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    console.log(`[EmbeddingService] Generating query embedding for: "${query.substring(0, 50)}..."`);
    return generateEmbedding(query);
}

// Export configuration for reference
export const EMBEDDING_CONFIG = {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
};
