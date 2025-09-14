/**
 * Japanese document processing evaluation utilities
 */

export interface EvaluationMetrics {
  accuracy: number
  cjkRecognitionRate: number
  chunkingQuality: number
  embeddingRelevance: number
  overallScore: number
}

export interface JapaneseTestCase {
  id: string
  name: string
  content: string
  expectedChunks: number
  expectedCJKRatio: number
  goldQuestions: string[]
  goldAnswers: string[]
}

// Sample test cases for Japanese document processing
export const JAPANESE_TEST_CASES: JapaneseTestCase[] = [
  {
    id: 'slide-01',
    name: 'ビジネスプレゼンテーション',
    content: `
      新製品開発戦略について
      
      • 市場調査の結果、顧客ニーズの多様化が進んでいる
      • AI技術を活用した新しいソリューションの開発が必要
      • 競合他社との差別化ポイントを明確にする
      
      今後のスケジュール：
      1. 技術検証フェーズ（3ヶ月）
      2. プロトタイプ開発（6ヶ月）
      3. 市場投入（12ヶ月後）
    `,
    expectedChunks: 3,
    expectedCJKRatio: 0.85,
    goldQuestions: [
      '新製品開発において、なぜAI技術の活用が必要とされているのですか？',
      '競合他社との差別化を図るために重要な要素は何ですか？',
      '新製品の市場投入までの全体スケジュールを教えてください。'
    ],
    goldAnswers: [
      '市場調査の結果、顧客ニーズの多様化が進んでおり、これに対応するための新しいソリューション開発にAI技術が必要とされています。',
      '競合他社との差別化ポイントを明確にすることが重要な要素です。',
      '技術検証フェーズ（3ヶ月）、プロトタイプ開発（6ヶ月）、市場投入（12ヶ月後）の順で進められます。'
    ]
  },
  {
    id: 'technical-01',
    name: '技術仕様書',
    content: `
      システム要件定義書
      
      機能要件：
      - ユーザー認証機能（OAuth 2.0対応）
      - データベース連携（PostgreSQL）
      - リアルタイム通信（WebSocket）
      
      非機能要件：
      - 可用性：99.9%以上
      - レスポンス時間：3秒以内
      - 同時接続ユーザー：1000人まで対応
      
      セキュリティ要件：
      - SSL/TLS暗号化
      - SQLインジェクション対策
      - CSRF攻撃防止
    `,
    expectedChunks: 4,
    expectedCJKRatio: 0.65,
    goldQuestions: [
      'システムの認証機能にはどのような技術が採用されていますか？',
      '非機能要件で定められているレスポンス時間の基準は？',
      'セキュリティ対策として実装される項目を列挙してください。'
    ],
    goldAnswers: [
      'OAuth 2.0に対応したユーザー認証機能が採用されています。',
      'レスポンス時間は3秒以内と定められています。',
      'SSL/TLS暗号化、SQLインジェクション対策、CSRF攻撃防止が実装されます。'
    ]
  }
]

/**
 * Evaluate Japanese document processing accuracy
 */
export async function evaluateJapaneseProcessing(
  processedContent: any,
  testCase: JapaneseTestCase
): Promise<EvaluationMetrics> {
  // Evaluate CJK recognition rate
  const cjkRecognitionRate = evaluateCJKRecognition(processedContent.text, testCase.content)
  
  // Evaluate chunking quality
  const chunkingQuality = evaluateChunkingQuality(
    processedContent.chunks || [],
    testCase.expectedChunks
  )
  
  // Evaluate Q&A accuracy (simplified)
  const accuracy = evaluateQAAccuracy(
    processedContent.questions || [],
    testCase.goldQuestions
  )
  
  // Calculate overall score
  const overallScore = (cjkRecognitionRate + chunkingQuality + accuracy) / 3
  
  return {
    accuracy,
    cjkRecognitionRate,
    chunkingQuality,
    embeddingRelevance: 0.85, // Placeholder
    overallScore
  }
}

function evaluateCJKRecognition(processedText: string, originalText: string): number {
  const originalCJK = (originalText.match(/[\u3040-\u30FF\u4E00-\u9FFF]/g) || []).length
  const processedCJK = (processedText.match(/[\u3040-\u30FF\u4E00-\u9FFF]/g) || []).length
  
  return Math.min(processedCJK / Math.max(originalCJK, 1), 1.0)
}

function evaluateChunkingQuality(chunks: any[], expectedCount: number): number {
  const chunkCount = chunks.length
  const countAccuracy = 1 - Math.abs(chunkCount - expectedCount) / Math.max(expectedCount, 1)
  
  // Check if chunks have reasonable size distribution
  const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / Math.max(chunks.length, 1)
  const sizeQuality = avgChunkSize > 200 && avgChunkSize < 1200 ? 1.0 : 0.7
  
  return (countAccuracy + sizeQuality) / 2
}

function evaluateQAAccuracy(generatedQuestions: string[], goldQuestions: string[]): number {
  // Simple semantic similarity check (in production, use embeddings)
  let matchCount = 0
  
  for (const goldQ of goldQuestions) {
    for (const genQ of generatedQuestions) {
      if (calculateSimpleSimilarity(goldQ, genQ) > 0.6) {
        matchCount++
        break
      }
    }
  }
  
  return matchCount / Math.max(goldQuestions.length, 1)
}

function calculateSimpleSimilarity(str1: string, str2: string): number {
  // Simple character-based similarity for Japanese
  const chars1 = new Set(str1.replace(/\s/g, ''))
  const chars2 = new Set(str2.replace(/\s/g, ''))
  
  const intersection = new Set([...chars1].filter(x => chars2.has(x)))
  const union = new Set([...chars1, ...chars2])
  
  return intersection.size / Math.max(union.size, 1)
}

/**
 * Run comprehensive evaluation on Japanese test cases
 */
export async function runJapaneseEvaluation(): Promise<{
  testResults: Array<{testCase: JapaneseTestCase, metrics: EvaluationMetrics}>
  summary: EvaluationMetrics
}> {
  const testResults: Array<{testCase: JapaneseTestCase, metrics: EvaluationMetrics}> = []
  
  // This would integrate with actual document processor
  console.log('日本語ドキュメント処理の評価を開始します...')
  
  for (const testCase of JAPANESE_TEST_CASES) {
    // Simulate processing (in real implementation, call actual processor)
    const processedContent = {
      text: testCase.content,
      chunks: [{content: testCase.content, type: 'body'}],
      questions: testCase.goldQuestions.slice(0, 2) // Simulate partial match
    }
    
    const metrics = await evaluateJapaneseProcessing(processedContent, testCase)
    testResults.push({ testCase, metrics })
    
    console.log(`テストケース ${testCase.name}: スコア ${(metrics.overallScore * 100).toFixed(1)}%`)
  }
  
  // Calculate summary metrics
  const summary: EvaluationMetrics = {
    accuracy: testResults.reduce((sum, r) => sum + r.metrics.accuracy, 0) / testResults.length,
    cjkRecognitionRate: testResults.reduce((sum, r) => sum + r.metrics.cjkRecognitionRate, 0) / testResults.length,
    chunkingQuality: testResults.reduce((sum, r) => sum + r.metrics.chunkingQuality, 0) / testResults.length,
    embeddingRelevance: testResults.reduce((sum, r) => sum + r.metrics.embeddingRelevance, 0) / testResults.length,
    overallScore: testResults.reduce((sum, r) => sum + r.metrics.overallScore, 0) / testResults.length
  }
  
  return { testResults, summary }
}

export default {
  evaluateJapaneseProcessing,
  runJapaneseEvaluation,
  JAPANESE_TEST_CASES
}