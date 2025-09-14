import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { generateEnhancedEmbedding } from './openai'
import { 
  createSlideAwareChunks, 
  optimizeChunks, 
  needsJapaneseOCR, 
  analyzeCJKContent,
  normalizeJapaneseText 
} from './japanese-utils'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

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
  bbox?: { x: number; y: number; width: number; height: number }
  role?: 'title' | 'bullet' | 'body' | 'table' | 'caption'
  level?: number
}

interface LayoutBlock {
  bbox: { x: number; y: number; width: number; height: number }
  role: 'title' | 'bullet' | 'body' | 'table' | 'caption'
  text: string
  level?: number
}

interface SlideLayout {
  page: number
  blocks: LayoutBlock[]
  tables: any[]
  images: string[]
  figureCaption?: string
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
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured. Document processing will fail.')
    }
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: `以後の出力はすべて日本語で。専門用語は日本語優先、英語原語は括弧で併記。回答には必ずスライド番号/ページ番号を根拠として引用すること。図表がある場合は図表の要点を短く言い換えること。`,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain"
      }
    })
    this.visionModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `日本語で出力。画像の読み取りと理解に特化。縦書き・横書き両方に対応。表や図表の構造を正確に認識。`,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "text/plain"
      }
    })
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
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific API key related errors
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || 
            errorMessage.includes('credential') || errorMessage.includes('key not valid')) {
          errorMessage = 'API key configuration error. Please check Gemini API key settings.';
        }
      }
      
      await this.updateStatus(sessionId, 'failed', 0, `Processing failed: ${errorMessage}`)
      throw error;
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
      // First, try standard PDF text extraction
      const initialExtractionResult = await this.extractInitialPDFContent(documentContent, fileType)
      
      // Check if we need OCR for better Japanese recognition
      if (this.needsJapaneseOCR(initialExtractionResult.text, initialExtractionResult.hasRasterPages)) {
        console.log('Low CJK content detected, switching to Japanese OCR pipeline')
        return await this.extractWithJapaneseOCR(documentContent, fileType, options)
      }
      
      return initialExtractionResult.segments
    } else if (fileType.startsWith('image/')) {
      return await this.extractImageContent(documentContent, fileType, options)
    }

    return segments.filter(segment => segment.content.trim().length > 50)
  }
  
  /**
   * Add chart/diagram captioning for visual content
   */
  private async generateFigureCaption(imageData: string, mimeType: string): Promise<string> {
    const prompt = `
      この図やグラフを分析し、箱条書きで簡潔に説明してください：
      - 図の種類（グラフ、表、図解など）
      - 軸名や凡例（ある場合）
      - 主要なデータポイントや傾向
      - 重要な結論（1行）
      
      日本語で出力し、簡潔にまとめてください。
    `
    
    try {
      const result = await this.visionModel.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageData
          }
        },
        prompt
      ])
      
      return result.response.text().trim()
    } catch (error) {
      console.error('Figure caption generation error:', error)
      return '図表の説明を生成できませんでした。'
    }
  }

  /**
   * Initial PDF content extraction to check if OCR is needed
   */
  private async extractInitialPDFContent(documentContent: Buffer, fileType: string): Promise<{text: string, segments: DocumentSegment[], hasRasterPages: boolean}> {
    const base64Content = documentContent.toString('base64')
    
    const prompt = `
      PDFドキュメントからテキストコンテンツを抽出し、論理的にセグメント化してください。
      日本語の認識精度を重視し、レイアウトと読み順を保持してください。
      
      JSON形式で返してください:
      {
        "segments": [
          {
            "content": "テキストコンテンツ",
            "type": "text",
            "pageNumber": 1,
            "confidence": 0.95,
            "role": "title|bullet|body"
          }
        ],
        "hasRasterPages": true,
        "totalText": "全体のテキスト内容"
      }
      
      出力は日本語で。
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = JSON.parse(cleanedResponse)
      
      return {
        text: parsedResponse.totalText || '',
        segments: parsedResponse.segments || [],
        hasRasterPages: parsedResponse.hasRasterPages || false
      }
    } catch (error) {
      console.error('Initial PDF extraction error:', error)
      return { text: '', segments: [], hasRasterPages: true }
    }
  }

  /**
   * Enhanced image content extraction with Japanese support
   */
  private async extractImageContent(documentContent: Buffer, fileType: string, options: ProcessingOptions): Promise<DocumentSegment[]> {
    const base64Content = documentContent.toString('base64')
    
    const prompt = `
      この画像を分析し、すべての読み取り可能なテキストコンテンツを抽出してください。
      ドキュメント、プレゼンテーションスライド、または構造化された情報が含まれている場合は、
      抽出されたテキストを論理的なセグメントに整理してください。
      
      特に注意すること:
      - 日本語の縦書き・横書き両方に対応
      - 図表のキャプションと本文を区別
      - 読み順（上→下、左→右）を考慮
      - 表は構造を保持
      
      JSON形式で返してください:
      {
        "segments": [
          {
            "content": "抽出されたテキスト内容",
            "type": "text",
            "confidence": 0.9,
            "role": "title|bullet|body|table|caption",
            "bbox": {"x": 0, "y": 0, "width": 100, "height": 50}
          }
        ],
        "figureCaption": "図表の要点説明"
      }
      
      出力は日本語で。
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = JSON.parse(cleanedResponse)
      
      return parsedResponse.segments || []
    } catch (error) {
      console.error('Image extraction error:', error)
      throw new Error('Failed to extract content from image')
    }
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
      以下のテキストセグメントに基づいて、高品質な面接質問と回答を生成してください。
      
      テキストセグメント:
      "${segment.content}"
      
      要件:
      - 最大${options.maxQuestionsPerSegment}個の質問を生成
      - 含める質問タイプ: ${questionTypesList}
      - 言語: 日本語
      - 実践的な面接シナリオに焦点を当てる
      - 回答は包括的で正確であることを確保
      - 専門用語は日本語優先、必要に応じて英語を括弧内に併記
      
      各質問について以下も提供してください:
      - 質問タイプ (factual/conceptual/application/analytical)
      - 品質スコア (0-1、1が最高)
      - 信頼度レベル (0-1)
      
      以下のJSON形式で返してください:
      {
        "qa_pairs": [
          {
            "question": "ここに質問を記入？",
            "answer": "詳細な回答をここに記入",
            "questionType": "factual",
            "qualityScore": 0.85,
            "confidence": 0.9
          }
        ]
      }
      
      出力は日本語で。
    `

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text()
      
      // Clean the response to handle markdown-wrapped JSON
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = JSON.parse(cleanedResponse)
      
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
    // Create collection with Japanese-aware naming
    const collectionName = `ドキュメントQ&A: ${session.file_name}`
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('qna_collections')
      .insert({
        user_id: session.user_id,
        name: collectionName,
        description: `ドキュメントから生成: ${session.file_name}`,
        source_document_id: session.id,
        document_metadata: {
          originalFileName: session.file_name,
          fileType: session.file_type,
          fileSize: session.file_size,
          language: '日本語',
          processingVersion: '2.0-japanese'
        }
      })
      .select()
      .single()

    if (collectionError) {
      throw new Error(`Failed to create collection: ${collectionError.message}`)
    }

    // Create Q&A items with enhanced Japanese embeddings
    const itemsToInsert = await Promise.all(
      qaItems.map(async (qa) => {
        try {
          const { embedding, keyTerms } = await generateEnhancedEmbedding(
            qa.question,
            `コンテキスト: ${qa.sourceSegment.substring(0, 200)}`
          )
          
          return {
            collection_id: collection.id,
            question: qa.question,
            answer: qa.answer,
            source_segment: qa.sourceSegment,
            quality_score: qa.qualityScore,
            question_type: qa.questionType,
            review_status: 'pending' as const,
            embedding: embedding,
            metadata: {
              keyTerms,
              language: '日本語',
              confidence: qa.confidence
            }
          }
        } catch (embeddingError) {
          console.error('Embedding generation failed for QA item:', embeddingError)
          // Fallback: use simple embedding without enhancement
          const fallbackEmbedding = await generateEnhancedEmbedding(qa.question)
          return {
            collection_id: collection.id,
            question: qa.question,
            answer: qa.answer,
            source_segment: qa.sourceSegment,
            quality_score: qa.qualityScore,
            question_type: qa.questionType,
            review_status: 'pending' as const,
            embedding: fallbackEmbedding.embedding,
            metadata: {
              keyTerms: fallbackEmbedding.keyTerms,
              language: '日本語',
              confidence: qa.confidence
            }
          }
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
      language: '日本語',
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

  /**
   * Check if document needs Japanese OCR based on CJK character ratio
   */
  private needsJapaneseOCR(text: string, hasRasterPages: boolean): boolean {
    return needsJapaneseOCR(text, hasRasterPages)
  }
  
  /**
   * Extract content using Japanese-optimized OCR pipeline
   */
  private async extractWithJapaneseOCR(documentContent: Buffer, fileType: string, options: ProcessingOptions): Promise<DocumentSegment[]> {
    const base64Content = documentContent.toString('base64')
    
    const prompt = `
      この日本語PDFドキュメントから高精度でテキストを抽出し、レイアウト構造を保持してください。
      
      重要な要件:
      - languageHints: ["ja", "ja-JP"] を適用
      - 縦書き・横書きの混在に対応
      - スライドの場合：タイトル→箇条書き→表→キャプションの順で認識
      - 表の構造を正確に復元
      - 図表の説明文を含める
      - 読み順（トップ→ボトム、レフト→ライト）を考慮
      
      各ページについて以下のJSON構造で返してください:
      {
        "segments": [
          {
            "content": "正確に抽出されたテキスト",
            "type": "text|table|image",
            "pageNumber": 1,
            "confidence": 0.95,
            "role": "title|bullet|body|table|caption",
            "level": 1,
            "bbox": {"x": 0, "y": 0, "width": 100, "height": 50}
          }
        ]
      }
      
      必ず日本語で出力してください。英語の専門用語は日本語優先で、必要に応じて英語を括弧内に併記。
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = JSON.parse(cleanedResponse)
      
      return parsedResponse.segments || []
    } catch (error) {
      console.error('Japanese OCR extraction error:', error)
      throw new Error('Failed to extract content with Japanese OCR')
    }
  }
  
  /**
   * Clean AI response to extract JSON from markdown code blocks
   */
  private cleanJsonResponse(responseText: string): string {
    // Remove markdown code block wrappers
    let cleaned = responseText.trim()
    
    // Check if response is wrapped in markdown code blocks
    if (cleaned.startsWith('```json') || cleaned.startsWith('```')) {
      // Remove opening code block
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '')
      // Remove closing code block
      cleaned = cleaned.replace(/\n?```$/, '')
    }
    
    // Trim any remaining whitespace
    cleaned = cleaned.trim()
    
    return cleaned
  }
}

// Export function for background job processing
export async function processDocumentJob(sessionId: string) {
  const processor = new DocumentProcessor()
  await processor.processDocument(sessionId)
}