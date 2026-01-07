'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Database } from 'lucide-react'
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
  chunk_count: number // Legacy field, kept for type compatibility but ignored for File Search
  estimated_time_remaining?: number | null // Estimated seconds remaining
}

const STAGE_LABELS: Record<string, string> = {
  extracting_text: 'テキスト抽出',
  chunking: 'チャンク分割',
  generating_embeddings: 'ベクトル生成',
  storing_chunks: 'データ保存',
  completed: '完了',
  indexing: 'CueMeが学習中' // Added for File Search
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  extracting_text: 'ドキュメント内容を解析中',
  chunking: 'テキストを最適化中',
  generating_embeddings: 'Cuemeインデックスを作成中',
  storing_chunks: 'データベースに登録中',
  completed: 'すべての処理が完了しました',
  indexing: 'CueMeがあなたの回答を学習しています' // Added for File Search
}

// Helper function to format time remaining
function formatTimeRemaining(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return ''

  if (seconds < 60) {
    return `残り約${seconds}秒`
  } else {
    const minutes = Math.ceil(seconds / 60)
    return `残り約${minutes}分`
  }
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
          chunk_count: 0, // Ignore legacy chunks
          estimated_time_remaining: data.estimated_time_remaining
        })

        // Stop polling if completed or failed. For File Search, 'indexing' happens after upload.
        // We should treat 'indexing' as an active state.
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
      <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden mt-4">
        <CardContent className="p-4 border-l-4 border-red-500 bg-red-50/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mt-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'failed') {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mt-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-50 rounded-full shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">処理失敗</h3>
              <p className="text-sm text-gray-600 mb-0 leading-relaxed">
                {status.error_message || '処理中にエラーが発生しました'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'completed') {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mt-2">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#D8F9B8] text-black flex items-center justify-center shadow-sm">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">処理完了</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  処理が完了しました
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                Ready in RAG
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStage = status.status === 'indexing' ? 'indexing' : (status.processing_stage || 'extracting_text')
  const progress = status.processing_progress || 0

  return (
    <Card className="bg-white border border-gray-100 shadow-sm rounded-xl mt-2 overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            {/* Left side: Icon + Text */}
            <div className="flex gap-4">
              {/* Static icon instead of spinner */}
              <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <Database className="h-5 w-5 text-gray-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {STAGE_LABELS[currentStage] || '処理中'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {STAGE_DESCRIPTIONS[currentStage] || 'お待ちください...'}
                </p>
                {status.estimated_time_remaining && status.estimated_time_remaining > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimeRemaining(status.estimated_time_remaining)}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Percentage */}
            <div className="flex flex-col items-end">
              <span className="text-xl font-bold text-black">{progress}%</span>
            </div>
          </div>

          {/* Custom Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#D8F9B8] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
