import { NextRequest, NextResponse } from 'next/server'
import { generateNormalizedEmbedding } from '@/lib/gemini-embeddings'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    const embedding = await generateNormalizedEmbedding(text)

    return NextResponse.json({ embedding })
  } catch (error) {
    console.error('[EmbeddingsAPI] Error generating Gemini embedding:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
}