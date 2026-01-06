import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { generateEnhancedEmbedding } from './openai'
import { envValidator } from './env-validator'

// Validate environment and get config
const config = envValidator.getConfig()

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY)

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  config.NEXT_PUBLIC_SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
)

interface DocumentChunk {
  text: string
  order: number
}

export class SimpleDocumentProcessor {
  private model: GenerativeModel

  constructor() {
    // Validation happens at module load via config, but double-check here
    const validation = envValidator.validate()
    if (!validation.valid) {
      throw new Error(`SimpleDocumentProcessor initialization failed: ${validation.errors.join(', ')}`)
    }

    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `Extract and chunk text content from documents. Focus on preserving meaning and readability. Output clean, well-structured text chunks.`,
      generationConfig: {
        temperature: 0.1,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    })
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    })
    return Promise.race([promise, timeout])
  }

  private async updateProgress(
    documentId: string,
    stage: string,
    progress: number,
    status?: string
  ): Promise<void> {
    const updateData: Record<string, any> = {
      processing_stage: stage,
      processing_progress: progress,
    }

    if (status) {
      updateData.status = status
    }

    if (stage === 'extracting_text' && progress === 0) {
      updateData.processing_started_at = new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.processing_completed_at = new Date().toISOString()
      updateData.processing_stage = 'completed'
      updateData.processing_progress = 100
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', documentId)

    if (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        documentId,
        stage,
        progress,
        message: 'Progress update error',
        error: error.message
      }))
    }
  }

  async processDocument(documentId: string): Promise<void> {
    try {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        message: 'Starting document processing'
      }))

      // Initialize progress tracking
      await this.updateProgress(documentId, 'extracting_text', 0, 'processing')

      // Get document details
      const document = await this.getDocument(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Extract text with timeout (5 minutes)
      await this.updateProgress(documentId, 'extracting_text', 10)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'extracting_text',
        message: 'Starting text extraction'
      }))

      const textContent = await this.withTimeout(
        this.extractTextContent(document),
        5 * 60 * 1000,
        'Text extraction'
      )

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'extracting_text',
        textLength: textContent.length,
        message: 'Text extraction completed'
      }))

      // Create chunks with timeout (3 minutes)
      await this.updateProgress(documentId, 'chunking', 30)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'chunking',
        message: 'Starting text chunking'
      }))

      const chunks = await this.withTimeout(
        this.createChunks(textContent, 30),
        3 * 60 * 1000,
        'Chunking'
      )

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'chunking',
        chunkCount: chunks.length,
        message: 'Chunking completed'
      }))

      // Generate embeddings with timeout (5 minutes) and progress updates
      await this.updateProgress(documentId, 'generating_embeddings', 50)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'generating_embeddings',
        message: 'Starting embedding generation'
      }))

      const chunksWithEmbeddings = await this.withTimeout(
        this.generateAllEmbeddings(chunks, documentId),
        5 * 60 * 1000,
        'Embedding generation'
      )

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'generating_embeddings',
        message: 'Embedding generation completed'
      }))

      // Store chunks
      await this.updateProgress(documentId, 'storing_chunks', 90)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        stage: 'storing_chunks',
        message: 'Storing chunks in database'
      }))

      await this.storeChunksInDatabase(documentId, chunksWithEmbeddings)

      // Update to completed
      await this.updateProgress(documentId, 'completed', 100, 'completed')
      await this.updateDocumentStatus(documentId, 'completed', chunks.length)

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        documentId,
        chunkCount: chunks.length,
        message: 'Document processing completed successfully'
      }))

    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        message: 'Document processing failed'
      }))

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during processing'
      const errorStack = error instanceof Error ? error.stack : undefined

      // Store detailed error information
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          error_message: errorMessage,
          processing_error_details: {
            message: errorMessage,
            stack: errorStack,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', documentId)

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

  private async generateAllEmbeddings(
    chunks: DocumentChunk[],
    documentId: string
  ): Promise<Array<DocumentChunk & { embedding: number[] | null }>> {
    const total = chunks.length
    const results = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const progress = 50 + Math.floor((i / total) * 40) // 50-90%

      try {
        const { embedding } = await generateEnhancedEmbedding(chunk.text)
        results.push({ ...chunk, embedding })
      } catch (error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          documentId,
          chunkOrder: chunk.order,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to generate embedding for chunk'
        }))
        // Store without embedding if generation fails
        results.push({ ...chunk, embedding: null })
      }

      // Update progress every 5 chunks or on last chunk
      if (i % 5 === 0 || i === chunks.length - 1) {
        await this.updateProgress(documentId, 'generating_embeddings', progress)
      }
    }

    return results
  }

  private async storeChunksInDatabase(
    documentId: string,
    chunks: Array<DocumentChunk & { embedding: number[] | null }>
  ): Promise<void> {
    const chunksForDb = chunks.map((chunk) => ({
      document_id: documentId,
      chunk_text: chunk.text,
      chunk_order: chunk.order,
      embedding: chunk.embedding
    }))

    const { error } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunksForDb)

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