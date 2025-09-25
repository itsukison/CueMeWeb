/**
 * Japanese text processing utilities for better document handling
 */

export interface JapaneseChunk {
  content: string
  startIndex: number
  endIndex: number
  sentenceCount: number
  charCount: number
  type: 'title' | 'bullet' | 'body' | 'table' | 'caption'
}

export interface CJKAnalysis {
  cjkRatio: number
  isLikelyJapanese: boolean
  hasVerticalText: boolean
  charCount: number
  cjkCharCount: number
}

/**
 * Analyze CJK character ratio in text
 */
export function analyzeCJKContent(text: string): CJKAnalysis {
  if (!text || text.length === 0) {
    return {
      cjkRatio: 0,
      isLikelyJapanese: false,
      hasVerticalText: false,
      charCount: 0,
      cjkCharCount: 0
    }
  }

  const cjkChars = text.match(/[\u3040-\u30FF\u4E00-\u9FFF]/g) || []
  const cjkCharCount = cjkChars.length
  const totalChars = text.length
  const cjkRatio = cjkCharCount / Math.max(totalChars, 1)

  // Check for vertical text patterns (縦書き indicators)
  const verticalPatterns = /[「」『』（）｛｝〔〕【】〈〉《》]/g
  const hasVerticalText = verticalPatterns.test(text)

  return {
    cjkRatio,
    isLikelyJapanese: cjkRatio > 0.15,
    hasVerticalText,
    charCount: totalChars,
    cjkCharCount
  }
}

/**
 * Check if document needs Japanese OCR based on content analysis
 */
export function needsJapaneseOCR(text: string, hasRasterPages: boolean): boolean {
  const analysis = analyzeCJKContent(text)
  
  // If we have very little text extracted but expect Japanese content
  if (text.length < 50 && hasRasterPages) return true
  
  // If CJK ratio is low but we have raster pages that might contain Japanese
  return analysis.cjkRatio < 0.15 && hasRasterPages
}

/**
 * Split Japanese text into sentences respecting Japanese punctuation
 */
export function splitJapaneseSentences(text: string): string[] {
  if (!text) return []
  
  // Split on Japanese sentence endings with lookbehind to preserve punctuation
  const sentences = text.split(/(?<=[。！？])/g)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  return sentences
}

/**
 * Create Japanese-aware chunks optimized for retrieval
 */
export function createJapaneseChunks(
  text: string, 
  maxChars = 1000, 
  contentType: 'title' | 'bullet' | 'body' | 'table' | 'caption' = 'body'
): JapaneseChunk[] {
  if (!text || text.trim().length === 0) return []
  
  const sentences = splitJapaneseSentences(text.trim())
  const chunks: JapaneseChunk[] = []
  
  let currentChunk = ''
  let startIndex = 0
  let sentenceCount = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const potentialChunk = currentChunk + sentence
    
    // Check if adding this sentence would exceed the character limit
    if (potentialChunk.length > maxChars && currentChunk.length > 0) {
      // Create chunk from current content
      chunks.push({
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        sentenceCount,
        charCount: currentChunk.length,
        type: contentType
      })
      
      // Start new chunk
      currentChunk = sentence
      startIndex = startIndex + currentChunk.length
      sentenceCount = 1
    } else {
      // Add sentence to current chunk
      currentChunk = potentialChunk
      sentenceCount++
    }
  }
  
  // Add final chunk if there's remaining content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
      sentenceCount,
      charCount: currentChunk.length,
      type: contentType
    })
  }
  
  return chunks
}

/**
 * Smart chunking that preserves slide boundaries and content hierarchy
 */
export function createSlideAwareChunks(
  content: string,
  pageNumber?: number,
  role?: 'title' | 'bullet' | 'body' | 'table' | 'caption',
  maxChars = 1000
): JapaneseChunk[] {
  const chunks = createJapaneseChunks(content, maxChars, role || 'body')
  
  // Add slide context to each chunk
  return chunks.map(chunk => ({
    ...chunk,
    content: pageNumber 
      ? `スライド${pageNumber}: ${chunk.content}` 
      : chunk.content
  }))
}

/**
 * Merge short chunks to optimize retrieval efficiency
 */
export function optimizeChunks(chunks: JapaneseChunk[], minChars = 200): JapaneseChunk[] {
  if (chunks.length <= 1) return chunks
  
  const optimized: JapaneseChunk[] = []
  let i = 0
  
  while (i < chunks.length) {
    let currentChunk = chunks[i]
    
    // If current chunk is too short, try to merge with next
    while (
      i + 1 < chunks.length && 
      currentChunk.charCount < minChars &&
      currentChunk.type === chunks[i + 1].type
    ) {
      const nextChunk = chunks[i + 1]
      const mergedContent = currentChunk.content + '\n' + nextChunk.content
      
      currentChunk = {
        content: mergedContent,
        startIndex: currentChunk.startIndex,
        endIndex: nextChunk.endIndex,
        sentenceCount: currentChunk.sentenceCount + nextChunk.sentenceCount,
        charCount: mergedContent.length,
        type: currentChunk.type
      }
      
      i++
    }
    
    optimized.push(currentChunk)
    i++
  }
  
  return optimized
}

/**
 * Extract key terms and phrases from Japanese text
 */
export function extractKeyTerms(text: string): string[] {
  // Simple pattern matching for Japanese key terms
  const patterns = [
    // Technical terms in katakana
    /[\u30A0-\u30FF]{3,}/g,
    // Compound words with kanji
    /[\u4E00-\u9FFF]{2,}/g,
    // Terms in quotes
    /「[^」]+」/g,
    /『[^』]+』/g
  ]
  
  const terms = new Set<string>()
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(match => {
      if (match.length >= 2) {
        terms.add(match.replace(/[「」『』]/g, ''))
      }
    })
  })
  
  return Array.from(terms).slice(0, 10) // Return top 10 terms
}

/**
 * Clean and normalize Japanese text for better processing
 */
export function normalizeJapaneseText(text: string): string {
  return text
    // Normalize full-width to half-width numbers
    .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // Normalize full-width to half-width ASCII
    .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()
}