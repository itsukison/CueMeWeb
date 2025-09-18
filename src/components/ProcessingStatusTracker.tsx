'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText,
  Clock,
  BarChart3
} from 'lucide-react'

interface ProcessingStatusProps {
  sessionId: string
  onProcessingComplete: (collectionId: string) => void
  onProcessingError: (error: string) => void
}

interface ProcessingSession {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  currentStep: string | null
  errorMessage: string | null
  collectionId: string | null
  processingStats: {
    totalChunks?: number
    processedChunks?: number
    generatedQuestions?: number
    estimatedTimeRemaining?: number
    total_segments?: number
    total_questions?: number
    avg_quality_score?: number
    processing_time?: number
    processing_time_seconds?: number
  } | null
  createdAt: string
  updatedAt: string
}

const PROCESSING_STEPS = [
  'Starting document processing...',
  'Downloading document...',
  'Extracting content segments...',
  'Generating Q&A pairs...',
  'Creating collection and storing items...',
  'Finalizing processing...',
  'Processing completed successfully'
]

export default function ProcessingStatusTracker({ 
  sessionId, 
  onProcessingComplete, 
  onProcessingError 
}: ProcessingStatusProps) {
  const [session, setSession] = useState<ProcessingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    if (!polling) return

    const interval = setInterval(() => {
      fetchSession()
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [polling, sessionId])

  const fetchSession = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) return

      const response = await fetch(`/api/documents/status/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data)

        // Stop polling if completed, failed, or cancelled
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          setPolling(false)
          
          if (data.status === 'completed' && data.collectionId) {
            onProcessingComplete(data.collectionId)
          } else if (data.status === 'failed') {
            const errorMsg = data.errorMessage || 'Processing failed'
            console.error('Processing failed with error:', errorMsg)
            onProcessingError(errorMsg)
          }
        }
      } else {
        console.error('Failed to fetch session status')
      }
    } catch (error) {
      console.error('Status fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelProcessing = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) return

      const response = await fetch(`/api/documents/status/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      })

      if (response.ok) {
        fetchSession()
      }
    } catch (error) {
      console.error('Cancel error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading status...</span>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="flex items-center justify-center p-8">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-600">Session not found</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Processing Status
            </CardTitle>
            <Badge className={getStatusColor(session.status)}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{session.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  session.status === 'completed' ? 'bg-green-500' :
                  session.status === 'failed' ? 'bg-red-500' :
                  session.status === 'cancelled' ? 'bg-gray-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${session.progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          {session.currentStep && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {getStatusIcon(session.status)}
              <span className="text-gray-700">{session.currentStep}</span>
            </div>
          )}

          {/* Error Message */}
          {session.errorMessage && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{session.errorMessage}</span>
            </div>
          )}

          {/* Processing Statistics */}
          {session.processingStats && Object.keys(session.processingStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {session.processingStats.total_segments || 0}
                </div>
                <div className="text-sm text-gray-600">Segments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {session.processingStats.total_questions || 0}
                </div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {session.processingStats.avg_quality_score 
                    ? (session.processingStats.avg_quality_score * 100).toFixed(0) + '%'
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-600">Avg Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {session.processingStats.processing_time_seconds || 0}s
                </div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {session.status === 'processing' && (
              <Button
                variant="outline"
                onClick={cancelProcessing}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Processing
              </Button>
            )}
            
            {session.status === 'completed' && session.collectionId && (
              <Button
                onClick={() => onProcessingComplete(session.collectionId!)}
                className="bg-black text-white hover:bg-gray-900 rounded-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Collection
              </Button>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
            <div>Started: {formatDate(session.createdAt)}</div>
            <div>Last Updated: {formatDate(session.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Steps Visualization */}
      {session.status === 'processing' && (
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Processing Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PROCESSING_STEPS.map((step, index) => {
                const stepProgress = (index + 1) * (100 / PROCESSING_STEPS.length)
                const isCompleted = session.progress >= stepProgress
                const isCurrent = !isCompleted && session.progress >= (index * (100 / PROCESSING_STEPS.length))
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isCompleted ? 'bg-green-50' : 
                      isCurrent ? 'bg-blue-50' : 
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCompleted ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-600'
                    }`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}