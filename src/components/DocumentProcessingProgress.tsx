'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProcessingStatus {
  status: string
  processing_stage: string | null
  processing_progress: number
  error_message: string | null
  chunk_count: number
}

const STAGE_LABELS: Record<string, string> = {
  extracting_text: 'テキスト抽出中...',
  chunking: 'チャンク分割中...',
  generating_embeddings: 'ベクトル生成中...',
  storing_chunks: 'データ保存中...',
  completed: '完了'
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  extracting_text: 'AI がドキュメントからテキストを抽出しています',
  chunking: 'テキストを検索可能なチャンクに分割しています',
  generating_embeddings: '各チャンクのベクトル埋め込みを生成しています',
  storing_chunks: 'データベースに保存しています',
  completed: '処理が完了しました'
}

export default function DocumentProcessingProgress({
  documentId
}: {
  documentId: string
}) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(`/api/documents/status/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) throw new Error('Failed to fetch status')

        const data = await response.json()
        setStatus({
          status: data.status,
          processing_stage: data.processing_stage,
          processing_progress: data.processing_progress || 0,
          error_message: data.error_message,
          chunk_count: data.chunkCount || 0
        })

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Status check failed')
      }
    }

    pollStatus()
    pollInterval = setInterval(pollStatus, 3000)

    return () => clearInterval(pollInterval)
  }, [documentId])

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="bg-white/70 backdrop-blur-md">
        <CardContent className="p-6">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'failed') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">処理失敗</h3>
            <p className="text-red-700 mb-4">{status.error_message || '処理中にエラーが発生しました'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'completed') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">処理完了！</h3>
            <p className="text-green-700">{status.chunk_count} チャンクが生成されました</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStage = status.processing_stage || 'extracting_text'
  const progress = status.processing_progress || 0

  return (
    <Card className="bg-white/70 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {STAGE_LABELS[currentStage] || '処理中...'}
              </h3>
              <p className="text-sm text-gray-600">
                {STAGE_DESCRIPTIONS[currentStage] || ''}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>進捗状況</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Estimated time */}
          <p className="text-xs text-gray-500 text-center">
            通常 2-5 分程度かかります
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
