import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { generateEnhancedEmbedding } from './openai'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DocumentChunk {
  text: string
  order: number
}

export class SimpleDocumentProcessor {
  private model: GenerativeModel

  constructor() {
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured. Document processing will fail.')
    }
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: `Extract and chunk text content from documents. Focus on preserving meaning and readability. Output clean, well-structured text chunks.`,
      generationConfig: {
        temperature: 0.1,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: "text/plain"
      }
    })
  }

  async processDocument(documentId: string): Promise<void> {
    try {
      await this.updateDocumentStatus(documentId, 'processing')

      // Get document details
      const document = await this.getDocument(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Download and extract text content
      const textContent = await this.extractTextContent(document)

      // Create chunks (max 30)
      const chunks = await this.createChunks(textContent, 30)

      // Generate embeddings and store chunks
      await this.storeChunksWithEmbeddings(documentId, chunks)

      // Update document with completion status
      await this.updateDocumentStatus(documentId, 'completed', chunks.length)

    } catch (error) {
      console.error('Document processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during processing'
      await this.updateDocumentStatus(documentId, 'failed', undefined, errorMessage)
      throw error
    }
  }

  private async getDocument(documentId: string) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, user_id, file_name, file_type, file_path, status')
      .eq('id', documentId)
      .single()

    if (error) {
      console.error('Document fetch error:', error)
      return null
    }

    return data
  }

  private async extractTextContent(document: { file_path: string; file_name: string; file_type: string }): Promise<string> {
    // Get the file URL from storage using the stored file path
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(document.file_path)

    // Download the file
    const response = await fetch(publicUrl)
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`)
    }

    const fileBuffer = await response.arrayBuffer()
    const base64Content = Buffer.from(fileBuffer).toString('base64')

    // Extract text using Gemini
    const prompt = `
      Extract all readable text content from this document. 
      Preserve the logical structure and reading order.
      Remove any formatting artifacts but keep the meaning intact.
      Return only the clean text content, no additional commentary.
    `

    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: document.file_type,
            data: base64Content
          }
        },
        prompt
      ])

      return result.response.text().trim()
    } catch (error) {
      console.error('Text extraction error:', error)
      throw new Error('Failed to extract text from document')
    }
  }

  private async createChunks(text: string, maxChunks: number): Promise<DocumentChunk[]> {
    const prompt = `
      Split the following text into logical chunks for semantic search and retrieval.
      
      Requirements:
      - Create exactly ${maxChunks} chunks or fewer
      - Each chunk should be 200-500 words when possible
      - Preserve sentence and paragraph boundaries
      - Ensure each chunk is meaningful and self-contained
      - Maintain logical flow and context
      
      Text to chunk:
      "${text}"
      
      Return the chunks as a JSON array with this exact format:
      {
        "chunks": [
          {
            "text": "First chunk content here...",
            "order": 1
          },
          {
            "text": "Second chunk content here...",
            "order": 2
          }
        ]
      }
      
      Return only the JSON, no additional text.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text().trim()

      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsed = JSON.parse(cleanedResponse)

      if (!parsed.chunks || !Array.isArray(parsed.chunks)) {
        throw new Error('Invalid chunks format returned')
      }

      // Ensure we don't exceed maxChunks
      const chunks = parsed.chunks.slice(0, maxChunks)

      // Validate and clean chunks
      return chunks
        .filter((chunk: { text: string }) => chunk.text && chunk.text.trim().length > 50)
        .map((chunk: { text: string }, index: number) => ({
          text: chunk.text.trim(),
          order: index + 1
        }))

    } catch (error) {
      console.error('Chunking error:', error)
      // Fallback: simple text splitting
      return this.fallbackChunking(text, maxChunks)
    }
  }

  private fallbackChunking(text: string, maxChunks: number): DocumentChunk[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const targetChunkSize = Math.ceil(sentences.length / maxChunks)
    const chunks: DocumentChunk[] = []

    for (let i = 0; i < sentences.length; i += targetChunkSize) {
      const chunkSentences = sentences.slice(i, i + targetChunkSize)
      const chunkText = chunkSentences.join('. ').trim() + '.'

      if (chunkText.length > 50) {
        chunks.push({
          text: chunkText,
          order: chunks.length + 1
        })
      }

      if (chunks.length >= maxChunks) break
    }

    return chunks
  }

  private async storeChunksWithEmbeddings(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const { embedding } = await generateEnhancedEmbedding(chunk.text)
          return {
            document_id: documentId,
            chunk_text: chunk.text,
            chunk_order: chunk.order,
            embedding: embedding
          }
        } catch (error) {
          console.error(`Failed to generate embedding for chunk ${chunk.order}:`, error)
          // Store without embedding if generation fails
          return {
            document_id: documentId,
            chunk_text: chunk.text,
            chunk_order: chunk.order,
            embedding: null
          }
        }
      })
    )

    const { error } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunksWithEmbeddings)

    if (error) {
      throw new Error(`Failed to store chunks: ${error.message}`)
    }
  }

  private async updateDocumentStatus(documentId: string, status: string, chunkCount?: number, errorMessage?: string): Promise<void> {
    const updateData: { status: string; chunk_count?: number; error_message?: string } = { status }
    if (chunkCount !== undefined) {
      updateData.chunk_count = chunkCount
    }
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId)

    if (error) {
      console.error('Status update error:', error)
    }

    // If document completed successfully, increment usage tracking
    if (status === 'completed') {
      await this.incrementDocumentUsage(documentId)
    }
  }

  private async incrementDocumentUsage(documentId: string): Promise<void> {
    try {
      // Get document to find user_id
      const { data: document } = await supabaseAdmin
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single()

      if (!document) return

      const currentDate = new Date()
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      // Check if usage record exists
      const { data: existingUsage } = await supabaseAdmin
        .from('usage_tracking')
        .select('scanned_documents_used')
        .eq('user_id', document.user_id)
        .eq('month_year', monthYear)
        .single()

      if (existingUsage) {
        // Update existing record
        await supabaseAdmin
          .from('usage_tracking')
          .update({
            scanned_documents_used: existingUsage.scanned_documents_used + 1
          })
          .eq('user_id', document.user_id)
          .eq('month_year', monthYear)
      } else {
        // Create new record
        await supabaseAdmin
          .from('usage_tracking')
          .insert({
            user_id: document.user_id,
            month_year: monthYear,
            scanned_documents_used: 1,
            questions_used: 0,
            qna_files_used: 0
          })
      }
    } catch (error) {
      console.error('Error incrementing document usage:', error)
    }
  }

  private cleanJsonResponse(jsonString: string): string {
    // Remove markdown code blocks if present
    let cleaned = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim()

    // Fix common JSON issues
    cleaned = cleaned
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":') // Quote unquoted keys

    return cleaned
  }
}

// Export the main processing function
export async function processDocumentChunking(documentId: string): Promise<void> {
  const processor = new SimpleDocumentProcessor()
  await processor.processDocument(documentId)
}