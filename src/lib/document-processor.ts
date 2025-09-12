import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './openai'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProcessingOptions {
  segmentationStrategy: 'semantic' | 'structural' | 'size-based' | 'auto'
  questionTypes: ('factual' | 'conceptual' | 'application' | 'analytical')[]
  maxQuestionsPerSegment: number
  qualityThreshold: number
  language: string
  reviewRequired: boolean
}

interface DocumentSegment {
  content: string
  type: 'text' | 'image' | 'table'
  pageNumber?: number
  confidence: number
}

interface GeneratedQA {
  question: string
  answer: string
  questionType: string
  qualityScore: number
  sourceSegment: string
  confidence: number
}

export class DocumentProcessor {
  private model: GenerativeModel
  private visionModel: GenerativeModel

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async processDocument(sessionId: string): Promise<void> {
    try {
      await this.updateStatus(sessionId, 'processing', 10, 'Starting document processing...')

      // Get session details
      const session = await this.getSession(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }

      const options: ProcessingOptions = session.processing_options || this.getDefaultOptions()

      // Step 1: Download and process document
      await this.updateStatus(sessionId, 'processing', 20, 'Downloading document...')
      const documentContent = await this.downloadDocument(session.file_url)

      // Step 2: Extract segments based on file type
      await this.updateStatus(sessionId, 'processing', 30, 'Extracting content segments...')
      const segments = await this.extractSegments(documentContent, session.file_type, options)

      // Step 3: Generate Q&A pairs
      await this.updateStatus(sessionId, 'processing', 50, 'Generating Q&A pairs...')
      const qaItems = await this.generateQAItems(segments, options, sessionId)

      // Step 4: Create collection and store items
      await this.updateStatus(sessionId, 'processing', 80, 'Creating collection and storing items...')
      const collectionId = await this.createCollection(session, qaItems)

      // Step 5: Calculate final statistics
      await this.updateStatus(sessionId, 'processing', 90, 'Finalizing processing...')
      const stats = this.calculateProcessingStats(segments, qaItems)

      // Step 6: Complete processing
      await this.updateStatus(sessionId, 'completed', 100, 'Processing completed successfully', collectionId, stats)

    } catch (error) {
      console.error('Document processing error:', error)
      await this.updateStatus(sessionId, 'failed', 0, `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  private async downloadDocument(fileUrl: string): Promise<Buffer> {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  private async extractSegments(
    documentContent: Buffer, 
    fileType: string, 
    options: ProcessingOptions
  ): Promise<DocumentSegment[]> {
    const segments: DocumentSegment[] = []

    if (fileType === 'application/pdf') {
      // For PDF files, use Gemini to extract text content
      const base64Content = documentContent.toString('base64')
      
      const prompt = `
        Extract the text content from this PDF document and segment it logically.
        Please provide the content in clear, readable segments that can be used for creating interview questions.
        Focus on meaningful content blocks rather than formatting.
        
        Segmentation strategy: ${options.segmentationStrategy}
        
        Return the content as JSON in this format:
        {
          "segments": [
            {
              "content": "text content here",
              "type": "text",
              "pageNumber": 1,
              "confidence": 0.95
            }
          ]
        }
      `

      try {
        const result = await this.model.generateContent([
          {
            inlineData: {
              mimeType: fileType,
              data: base64Content
            }
          },
          prompt
        ])

        const responseText = result.response.text()
        const parsedResponse = JSON.parse(responseText)
        segments.push(...parsedResponse.segments)
      } catch (error) {
        console.error('PDF extraction error:', error)
        throw new Error('Failed to extract content from PDF')
      }

    } else if (fileType.startsWith('image/')) {
      // For image files, use Gemini Vision to extract text
      const base64Content = documentContent.toString('base64')
      
      const prompt = `
        Analyze this image and extract all readable text content.
        If this appears to be a document, presentation slide, or contains structured information,
        please organize the extracted text into logical segments.
        
        Return the content as JSON in this format:
        {
          "segments": [
            {
              "content": "extracted text content here",
              "type": "text",
              "confidence": 0.9
            }
          ]
        }
      `

      try {
        const result = await this.visionModel.generateContent([
          {
            inlineData: {
              mimeType: fileType,
              data: base64Content
            }
          },
          prompt
        ])

        const responseText = result.response.text()
        const parsedResponse = JSON.parse(responseText)
        segments.push(...parsedResponse.segments)
      } catch (error) {
        console.error('Image extraction error:', error)
        throw new Error('Failed to extract content from image')
      }
    }

    return segments.filter(segment => segment.content.trim().length > 50) // Filter out very short segments
  }

  private async generateQAItems(
    segments: DocumentSegment[], 
    options: ProcessingOptions, 
    sessionId: string
  ): Promise<GeneratedQA[]> {
    const allQAItems: GeneratedQA[] = []
    let processedSegments = 0

    for (const segment of segments) {
      try {
        processedSegments++
        const progress = 50 + (processedSegments / segments.length) * 30 // 50-80%
        await this.updateStatus(sessionId, 'processing', progress, `Generating Q&A for segment ${processedSegments}/${segments.length}`)

        const qaItems = await this.generateQAForSegment(segment, options)
        allQAItems.push(...qaItems)
      } catch (error) {
        console.error(`Error processing segment ${processedSegments}:`, error)
        // Continue with other segments
      }
    }

    // Filter by quality threshold
    return allQAItems.filter(qa => qa.qualityScore >= options.qualityThreshold)
  }

  private async generateQAForSegment(segment: DocumentSegment, options: ProcessingOptions): Promise<GeneratedQA[]> {
    const questionTypesList = options.questionTypes.join(', ')
    
    const prompt = `
      Based on the following text segment, generate high-quality interview questions and answers.
      
      Text segment:
      "${segment.content}"
      
      Requirements:
      - Generate up to ${options.maxQuestionsPerSegment} questions
      - Question types to include: ${questionTypesList}
      - Language: ${options.language}
      - Focus on practical interview scenarios
      - Ensure answers are comprehensive and accurate
      
      For each question, also provide:
      - Question type (factual/conceptual/application/analytical)
      - Quality score (0-1, where 1 is excellent)
      - Confidence level (0-1)
      
      Return as JSON in this format:
      {
        "qa_pairs": [
          {
            "question": "Your question here?",
            "answer": "Detailed answer here",
            "questionType": "factual",
            "qualityScore": 0.85,
            "confidence": 0.9
          }
        ]
      }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text()
      const parsedResponse = JSON.parse(responseText)
      
      return parsedResponse.qa_pairs.map((qa: any) => ({
        question: qa.question,
        answer: qa.answer,
        questionType: qa.questionType,
        qualityScore: qa.qualityScore,
        sourceSegment: segment.content.substring(0, 500) + (segment.content.length > 500 ? '...' : ''),
        confidence: qa.confidence
      }))
    } catch (error) {
      console.error('Q&A generation error:', error)
      return []
    }
  }

  private async createCollection(session: any, qaItems: GeneratedQA[]): Promise<string> {
    // Create collection
    const collectionName = `Document Q&A: ${session.file_name}`
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('qna_collections')
      .insert({
        user_id: session.user_id,
        name: collectionName,
        description: `Generated from document: ${session.file_name}`,
        source_document_id: session.id,
        document_metadata: {
          originalFileName: session.file_name,
          fileType: session.file_type,
          fileSize: session.file_size
        }
      })
      .select()
      .single()

    if (collectionError) {
      throw new Error(`Failed to create collection: ${collectionError.message}`)
    }

    // Create Q&A items with embeddings
    const itemsToInsert = await Promise.all(
      qaItems.map(async (qa) => {
        const embedding = await generateEmbedding(qa.question)
        return {
          collection_id: collection.id,
          question: qa.question,
          answer: qa.answer,
          source_segment: qa.sourceSegment,
          quality_score: qa.qualityScore,
          question_type: qa.questionType,
          review_status: 'pending' as const,
          embedding: embedding
        }
      })
    )

    const { error: itemsError } = await supabaseAdmin
      .from('qna_items')
      .insert(itemsToInsert)

    if (itemsError) {
      throw new Error(`Failed to create Q&A items: ${itemsError.message}`)
    }

    return collection.id
  }

  private calculateProcessingStats(segments: DocumentSegment[], qaItems: GeneratedQA[]) {
    return {
      total_segments: segments.length,
      total_questions: qaItems.length,
      avg_quality_score: qaItems.length > 0 ? qaItems.reduce((sum, qa) => sum + qa.qualityScore, 0) / qaItems.length : 0,
      processing_time_seconds: 0, // Will be calculated elsewhere
      question_types_distribution: this.getQuestionTypeDistribution(qaItems)
    }
  }

  private getQuestionTypeDistribution(qaItems: GeneratedQA[]) {
    const distribution: Record<string, number> = {}
    qaItems.forEach(qa => {
      distribution[qa.questionType] = (distribution[qa.questionType] || 0) + 1
    })
    return distribution
  }

  private getDefaultOptions(): ProcessingOptions {
    return {
      segmentationStrategy: 'auto',
      questionTypes: ['factual', 'conceptual', 'application'],
      maxQuestionsPerSegment: 3,
      qualityThreshold: 0.7,
      language: 'Japanese',
      reviewRequired: true
    }
  }

  private async getSession(sessionId: string) {
    const { data, error } = await supabaseAdmin
      .from('document_processing_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Session fetch error:', error)
      return null
    }

    return data
  }

  private async updateStatus(
    sessionId: string, 
    status: string, 
    progress: number, 
    currentStep: string, 
    collectionId?: string,
    processingStats?: any
  ) {
    const updateData: any = {
      status,
      progress,
      current_step: currentStep
    }

    if (collectionId) {
      updateData.collection_id = collectionId
    }

    if (processingStats) {
      updateData.processing_stats = processingStats
    }

    const { error } = await supabaseAdmin
      .from('document_processing_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      console.error('Status update error:', error)
    }
  }
}

// Export function for background job processing
export async function processDocumentJob(sessionId: string) {
  const processor = new DocumentProcessor()
  await processor.processDocument(sessionId)
}