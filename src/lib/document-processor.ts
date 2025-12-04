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
import { incrementQnAUsage, incrementDocumentScanUsage } from './server-usage-tracking'

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
  tables: Array<{
    rows: string[][]
    headers?: string[]
    caption?: string
  }>
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

interface ProcessingSession {
  id: string
  user_id: string
  file_name: string
  file_type: string
  file_size: number
  user: {
    id: string
  }
}

export class DocumentProcessor {
  private model: GenerativeModel
  private visionModel: GenerativeModel

  constructor() {
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured. Document processing will fail.')
    }
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `以後の出力はすべて日本語で。専門用語は日本語優先、英語原語は括弧で併記。回答には必ずスライド番号/ページ番号を根拠として引用すること。図表がある場合は図表の要点を短く言い換えること。`,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
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

      // Track document scan usage and QnA pairs created
      await incrementDocumentScanUsage(session.user_id)
      await incrementQnAUsage(session.user_id, qaItems.length)

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
  private async extractInitialPDFContent(documentContent: Buffer, fileType: string): Promise<{ text: string, segments: DocumentSegment[], hasRasterPages: boolean }> {
    const base64Content = documentContent.toString('base64')

    const prompt = `
      PDFドキュメントからテキストコンテンツを抽出し、論理的にセグメント化してください。
      日本語の認識精度を重視し、レイアウトと読み順を保持してください。
      
      必ず以下のJSON形式で返し、他のテキストは含めないでください:
      {
        "segments": [
          {
            "content": "テキスト内容",
            "type": "text",
            "pageNumber": 1,
            "confidence": 0.95,
            "role": "title"
          }
        ],
        "hasRasterPages": true,
        "totalText": "全テキスト内容"
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = this.safeJsonParse(cleanedResponse, {
        segments: [],
        hasRasterPages: true,
        totalText: ''
      }) as { segments: unknown[]; hasRasterPages: boolean; totalText: string }

      return {
        text: parsedResponse.totalText || '',
        segments: (parsedResponse.segments || []) as DocumentSegment[],
        hasRasterPages: parsedResponse.hasRasterPages || true
      }
    } catch (error) {
      console.error('Initial PDF extraction error:', error)
      // Return fallback data to trigger OCR
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
      
      特に注意すること:
      - 日本語の縦書き・横書き両方に対応
      - 表は構造を保持
      
      必ず以下のJSON形式のみで返し、他のテキストは含めないでください:
      {
        "segments": [
          {
            "content": "抽出されたテキスト内容",
            "type": "text",
            "confidence": 0.9,
            "role": "title"
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = this.safeJsonParse(cleanedResponse, { segments: [] }) as { segments: unknown[] }

      return (parsedResponse.segments || []) as DocumentSegment[]
    } catch (error) {
      console.error('Image extraction error:', error)
      throw new Error('Failed to extract content from image')
    }
  }

  /**
   * Enhanced Q&A generation with comprehensive factual documentation first
   */
  private async generateQAItems(
    segments: DocumentSegment[],
    options: ProcessingOptions,
    sessionId: string
  ): Promise<GeneratedQA[]> {
    console.log('Starting comprehensive document analysis and Q&A generation...')

    // Stage 1: Generate comprehensive factual Q&A covering all document details first
    await this.updateStatus(sessionId, 'processing', 52, 'Creating comprehensive factual documentation...')
    const factualQAItems = await this.generateComprehensiveFactualQA(segments, sessionId)

    // Stage 2: Generate other types of questions based on factual foundation  
    await this.updateStatus(sessionId, 'processing', 75, 'Generating advanced question types...')
    const advancedQAItems = await this.generateAdvancedQuestions(segments, options, sessionId)

    // Combine all Q&A items with factual questions prioritized
    const allQAItems = [...factualQAItems, ...advancedQAItems]

    console.log(`Generated ${factualQAItems.length} factual Q&As and ${advancedQAItems.length} advanced Q&As`)

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
      const parsedResponse = this.safeJsonParse(cleanedResponse, { qa_pairs: [] }) as { qa_pairs: { question: string; answer: string; difficulty?: string; category?: string }[] }

      return parsedResponse.qa_pairs.map((qa: { question: string; answer: string; difficulty?: string; category?: string }) => ({
        question: qa.question,
        answer: qa.answer,
        questionType: qa.category || 'factual',
        qualityScore: 0.8,
        sourceSegment: segment.content.substring(0, 500) + (segment.content.length > 500 ? '...' : ''),
        confidence: 0.8
      }))
    } catch (error) {
      console.error('Q&A generation error:', error)
      return []
    }
  }

  /**
   * Generate comprehensive factual Q&A covering every detail in the document
   */
  private async generateComprehensiveFactualQA(
    segments: DocumentSegment[],
    sessionId: string
  ): Promise<GeneratedQA[]> {
    const factualQAItems: GeneratedQA[] = []
    const fullText = segments.map(s => s.content).join('\n\n')

    // Process in chunks to ensure comprehensive coverage
    const chunkSize = 3
    for (let i = 0; i < segments.length; i += chunkSize) {
      const chunk = segments.slice(i, i + chunkSize)
      const progress = Math.round(52 + ((i / segments.length) * 18)) // 52-70%
      await this.updateStatus(sessionId, 'processing', progress, `Creating comprehensive factual Q&A ${Math.floor(i / chunkSize) + 1}/${Math.ceil(segments.length / chunkSize)}`)

      try {
        const chunkText = chunk.map(s => s.content).join('\n')

        const prompt = `
          以下のテキストセクションから、すべての事実情報を抽出し、包括的な質問と回答のペアを作成してください。
          文書のあらゆる詳細を網羅する事実的な質問を生成することが重要です。
          
          テキストセクション:
          "${chunkText}"
          
          すべての事実を網羅する質問を作成してください:
          - 数値データ（価格、数量、パーセンテージなど）
          - 日付と期間  
          - 名前（人物、組織、製品、場所）
          - プロセスと手順の詳細
          - 仕様と特徴
          - 関係性と構造
          - 定義と説明
          
          質問は具体的で詳細にし、回答には文書からの正確な情報を含めてください。
          各事実について最低1つの質問を作成し、文書内容を完全にカバーしてください。
          
          必ず以下のJSON形式で返してください:
          {
            "qa_pairs": [
              {
                "question": "具体的で詳細な事実確認質問",
                "answer": "文書からの正確で詳細な回答（根拠となるページ番号や具体的な数値を含む）",
                "questionType": "factual",
                "qualityScore": 0.9,
                "confidence": 0.95
              }
            ]
          }
        `

        const result = await this.model.generateContent(prompt)
        const responseText = result.response.text()
        const cleanedResponse = this.cleanJsonResponse(responseText)
        const parsedResponse = this.safeJsonParse(cleanedResponse, { qa_pairs: [] }) as { qa_pairs: { question: string; answer: string; qualityScore?: number; difficulty?: string; category?: string }[] }

        const chunkQAItems = parsedResponse.qa_pairs.map((qa: { question: string; answer: string; qualityScore?: number; difficulty?: string; category?: string }) => ({
          question: qa.question,
          answer: qa.answer,
          questionType: 'factual',
          qualityScore: qa.qualityScore || 0.85,
          sourceSegment: chunkText.substring(0, 500) + (chunkText.length > 500 ? '...' : ''),
          confidence: 0.9
        }))

        factualQAItems.push(...chunkQAItems)

      } catch (error) {
        console.error(`Error generating factual Q&A for chunk ${Math.floor(i / chunkSize) + 1}:`, error)
        // Continue with other chunks
      }
    }

    return factualQAItems
  }

  /**
   * Generate advanced question types after factual foundation is established
   */
  private async generateAdvancedQuestions(
    segments: DocumentSegment[],
    options: ProcessingOptions,
    sessionId: string
  ): Promise<GeneratedQA[]> {
    const advancedQAItems: GeneratedQA[] = []

    // Only generate non-factual question types
    const advancedTypes = options.questionTypes.filter(type => type !== 'factual')

    if (advancedTypes.length === 0) {
      return []
    }

    const fullText = segments.map(s => s.content).join('\n\n')

    for (let i = 0; i < advancedTypes.length; i++) {
      const questionType = advancedTypes[i]
      const progress = Math.round(75 + (i / advancedTypes.length) * 5) // 75-80%
      await this.updateStatus(sessionId, 'processing', progress, `Generating ${questionType} questions...`)

      try {
        const prompt = `
          以下の文書内容に基づいて、${questionType}タイプの質問を作成してください。
          事実的な質問は既に作成済みなので、より深い理解や応用を促す質問に焦点を当ててください。
          
          文書内容:
          "${fullText.substring(0, 3000)}..."
          
          ${questionType}タイプの質問の特徴:
          - conceptual: 概念や理論の理解を問う
          - application: 実際の応用や適用を問う  
          - analytical: 分析や評価を問う
          
          既存の事実的情報を前提として、より深い理解や応用を促す質問を作成してください。
          
          必ず以下のJSON形式で返してください:
          {
            "qa_pairs": [
              {
                "question": "${questionType}タイプの質問",
                "answer": "詳細で実践的な回答",
                "questionType": "${questionType}",
                "qualityScore": 0.85,
                "confidence": 0.9
              }
            ]
          }
        `

        const result = await this.model.generateContent(prompt)
        const responseText = result.response.text()
        const cleanedResponse = this.cleanJsonResponse(responseText)
        const parsedResponse = this.safeJsonParse(cleanedResponse, { qa_pairs: [] }) as { qa_pairs: { question: string; answer: string; qualityScore?: number; difficulty?: string; category?: string }[] }

        const typeQAItems = parsedResponse.qa_pairs.map((qa: { question: string; answer: string; qualityScore?: number; difficulty?: string; category?: string }) => ({
          question: qa.question,
          answer: qa.answer,
          questionType: questionType,
          qualityScore: qa.qualityScore || 0.8,
          sourceSegment: fullText.substring(0, 500) + (fullText.length > 500 ? '...' : ''),
          confidence: 0.85
        }))

        advancedQAItems.push(...typeQAItems)

      } catch (error) {
        console.error(`Error generating ${questionType} questions:`, error)
        // Continue with other question types
      }
    }

    return advancedQAItems
  }

  private async createCollection(session: ProcessingSession, qaItems: GeneratedQA[]): Promise<string> {
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
            embedding: embedding
            // Note: metadata column removed as it doesn't exist in current schema
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
            embedding: fallbackEmbedding.embedding
            // Note: metadata column removed as it doesn't exist in current schema
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
    processingStats?: {
      totalChunks?: number
      processedChunks?: number
      generatedQuestions?: number
      estimatedTimeRemaining?: number
      total_segments?: number
      total_questions?: number
      avg_quality_score?: number
      processing_time_seconds?: number
      question_types_distribution?: Record<string, number>
    }
  ) {
    const updateData: {
      status: string
      progress: number
      current_step: string
      collection_id?: string
      processing_stats?: object
    } = {
      status,
      progress: Math.round(progress), // Ensure progress is always an integer
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
      この日本語PDFドキュメントから高精度でテキストを抽出してください。
      
      重要な要件:
      - 縦書き・横書きの混在に対応
      - 表の構造を正確に復元
      - 読み順を考慮
      
      必ず以下のJSON形式のみで返し、他のテキストは一切含めないでください:
      {
        "segments": [
          {
            "content": "抽出されたテキスト",
            "type": "text",
            "pageNumber": 1,
            "confidence": 0.95,
            "role": "title"
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
      const cleanedResponse = this.cleanJsonResponse(responseText)
      const parsedResponse = this.safeJsonParse(cleanedResponse, { segments: [] }) as { segments: unknown[] }

      return (parsedResponse.segments || []) as DocumentSegment[]
    } catch (error) {
      console.error('Japanese OCR extraction error:', error)
      throw new Error('Failed to extract content with Japanese OCR')
    }
  }

  /**
   * Safe JSON parsing with comprehensive fallback and retry logic - Enhanced for Japanese text
   */
  private safeJsonParse(jsonString: string, fallbackData: unknown = null): unknown {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('JSON parsing failed:', error)
      console.error('Problematic JSON:', jsonString.substring(0, 500) + '...')

      // Try multiple sophisticated cleaning strategies for Japanese text
      const cleaningStrategies = [
        // Strategy 1: Advanced comma insertion with context awareness
        (json: string) => {
          return json
            // Remove non-printable characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Fix missing commas between objects - more precise detection
            .replace(/}(\s*){/g, '},$1{')
            .replace(/}\s*\n\s*{/g, '},{')
            // Fix missing commas after property values before new properties
            .replace(/"(\s*)"[a-zA-Z_]/g, '",$1"')
            // Fix missing commas in arrays
            .replace(/](\s*){/g, '],$1{')
            .replace(/}(\s*)\[/g, '},$1[')
            // Fix content patterns specifically
            .replace(/"role":\s*"[^"]*"(\s*)}(\s*){/g, '$1},$2{')
            .replace(/"pageNumber":\s*\d+(\s*)}(\s*){/g, '$1},$2{')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
        },

        // Strategy 2: Japanese text specific fixes
        (json: string) => {
          return json
            // Fix Japanese text with single backslashes - most common issue
            .replace(/"([^"]*?)\\([^ntr"\\\\])([^"]*?)"/g, '"$1\\\\$2$3"')
            // Fix double backslashes that should be quad backslashes
            .replace(/"([^"]*?)\\\\([^ntr"])([^"]*?)"/g, '"$1\\\\\\\\$2$3"')
            // Fix backslash followed by characters that aren't escape sequences
            .replace(/"([^"]*?)\\([あ-んア-ン一-龯０-９])/g, '"$1\\\\$2')
            // Fix orphaned backslashes at end of strings
            .replace(/"([^"]*?)\\"(?=[,\}\]])/g, '"$1\\\\"')
            // Fix newlines in Japanese strings
            .replace(/"([^"]*[あ-んア-ン一-龯])\n([^"]*?)"/g, '"$1\\n$2"')
        },

        // Strategy 3: Structural JSON fixes
        (json: string) => {
          return json
            // Fix array/object separators
            .replace(/"(\s*)\n(\s*)"/g, '",\\n"')
            // Fix object key-value separators
            .replace(/:([^\s"][^,}]*?)([,}])/g, ': "$1"$2')
            // Ensure proper quotation
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":')
        },

        // Strategy 4: Aggressive cleanup as last resort
        (json: string) => {
          return json
            // Replace all single backslashes with double backslashes
            .replace(/([^\\])\\([^\\ntr"])/g, '$1\\\\$2')
            // Fix multiple consecutive backslashes
            .replace(/\\{3,}/g, '\\\\')
            // Remove problematic escape sequences
            .replace(/\\[^ntr"\\]/g, '\\\\')
        }
      ]

      // Try each cleaning strategy
      for (let i = 0; i < cleaningStrategies.length; i++) {
        try {
          let cleaned = jsonString
          // Apply all strategies up to current one
          for (let j = 0; j <= i; j++) {
            cleaned = cleaningStrategies[j](cleaned)
          }

          const parsed = JSON.parse(cleaned)
          console.log(`JSON parsing succeeded with strategy ${i + 1}`)
          return parsed
        } catch (strategyError) {
          // Continue to next strategy
          if (i === cleaningStrategies.length - 1) {
            console.error(`All JSON cleaning strategies failed. Last error:`, strategyError)
          }
        }
      }

      // Enhanced manual reconstruction - extract actual content instead of fallback messages
      try {
        console.log('Attempting enhanced content extraction...')

        // Try to extract actual content segments from the malformed JSON
        const contentMatches = jsonString.match(/"content":\s*"([^"]+)"/g)
        const reconstructed: Record<string, unknown> = {}

        if (contentMatches && contentMatches.length > 0) {
          console.log(`Found ${contentMatches.length} content segments, reconstructing...`)

          const segments = contentMatches.slice(0, 15).map((match, index) => {
            const content = match.match(/"content":\s*"([^"]+)"/)?.[1] || `Content ${index + 1}`
            return {
              content: content.replace(/\\n/g, '\n'), // Fix escaped newlines
              type: "text",
              pageNumber: Math.floor(index / 3) + 1,
              confidence: 0.8,
              role: index === 0 ? "title" : "body"
            }
          })

          reconstructed.segments = segments
          console.log('Enhanced content extraction successful')
          return reconstructed
        }

        // Fallback pattern matching for QA pairs
        const qaMatches = jsonString.match(/"question":\s*"([^"]+)"/g)
        if (qaMatches && qaMatches.length > 0) {
          const qaPairs = qaMatches.slice(0, 10).map((match, index) => {
            const question = match.match(/"question":\s*"([^"]+)"/)?.[1] || `Question ${index + 1}`
            return {
              question: question,
              answer: "Answer extracted from partially parsed content",
              questionType: "factual",
              qualityScore: 0.7,
              confidence: 0.7
            }
          })

          reconstructed.qa_pairs = qaPairs
          console.log('Enhanced QA extraction successful')
          return reconstructed
        }

      } catch (reconstructError) {
        console.error('Enhanced content extraction failed:', reconstructError)
      }

      // Ultimate fallback
      if (fallbackData) {
        console.warn('Using fallback data due to complete JSON parsing failure')
        return fallbackData
      }

      throw new Error(`Failed to parse AI response as JSON after all strategies: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Enhanced JSON response cleaner with better error handling for Japanese text
   */
  private cleanJsonResponse(responseText: string): string {
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from AI model')
    }

    let cleaned = responseText.trim()

    // Remove markdown code block wrappers
    if (cleaned.startsWith('```json') || cleaned.startsWith('```')) {
      // Remove opening code block
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '')
      // Remove closing code block
      cleaned = cleaned.replace(/\n?```$/, '')
    }

    // Remove any explanatory text before JSON
    cleaned = cleaned.replace(/^[^{]*/, '')

    // Remove any text before the first { and after the last }
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error('No valid JSON object found in response')
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1)

    // Enhanced cleaning for Japanese text
    cleaned = cleaned
      // Fix missing commas between objects - primary issue
      .replace(/}(\s*){/g, '}, {')
      .replace(/}\s*\n\s*{/g, '},\n{')
      // Fix missing commas in arrays
      .replace(/}(\s*)\[/g, '}, [')
      .replace(/](\s*){/g, '], {')
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix control characters but preserve Japanese characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize spacing while preserving Japanese text
      .replace(/\s{2,}/g, ' ')

    return cleaned.trim()
  }
}

// Export function for background job processing
export async function processDocumentJob(sessionId: string) {
  const processor = new DocumentProcessor()
  await processor.processDocument(sessionId)
}