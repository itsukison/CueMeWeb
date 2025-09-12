'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DocumentUploadInterface from '@/components/DocumentUploadInterface'
import ProcessingStatusTracker from '@/components/ProcessingStatusTracker'
import QAReviewInterface from '@/components/QAReviewInterface'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Upload, Settings, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type ProcessingStage = 'upload' | 'processing' | 'review' | 'complete'

interface StageInfo {
  title: string
  description: string
  icon: React.ReactNode
}

const STAGES: Record<ProcessingStage, StageInfo> = {
  upload: {
    title: 'Upload Document',
    description: 'Select and upload your document (PDF, PNG, or JPEG)',
    icon: <Upload className="h-5 w-5" />
  },
  processing: {
    title: 'Processing Document',
    description: 'AI is analyzing your document and generating Q&A pairs',
    icon: <Settings className="h-5 w-5" />
  },
  review: {
    title: 'Review & Approve',
    description: 'Review the generated questions and approve the ones you want to keep',
    icon: <FileText className="h-5 w-5" />
  },
  complete: {
    title: 'Complete',
    description: 'Your document Q&A collection has been created successfully',
    icon: <CheckCircle className="h-5 w-5" />
  }
}

export default function DocumentQAPage() {
  const router = useRouter()
  const [currentStage, setCurrentStage] = useState<ProcessingStage>('upload')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUploadComplete = (newSessionId: string) => {
    setSessionId(newSessionId)
    setCurrentStage('processing')
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    // You could show a toast notification here
  }

  const handleProcessingComplete = (newCollectionId: string) => {
    setCollectionId(newCollectionId)
    setCurrentStage('review')
  }

  const handleProcessingError = (error: string) => {
    console.error('Processing error:', error)
    // You could show a toast notification here
  }

  const handleReviewComplete = (finalCollectionId: string) => {
    setCollectionId(finalCollectionId)
    setCurrentStage('complete')
  }

  const handleSaveDraft = (approvedItems: string[]) => {
    console.log('Draft saved:', approvedItems)
    // You could show a toast notification here
  }

  const resetToUpload = () => {
    setCurrentStage('upload')
    setSessionId(null)
    setCollectionId(null)
    setUploadProgress(0)
  }

  const viewCollection = () => {
    if (collectionId) {
      router.push(`/dashboard/collections/${collectionId}`)
    }
  }

  const renderStageIndicator = () => {
    const stages: ProcessingStage[] = ['upload', 'processing', 'review', 'complete']
    
    return (
      <div className="flex items-center justify-between mb-8">
        {stages.map((stage, index) => {
          const isActive = stage === currentStage
          const isCompleted = stages.indexOf(currentStage) > index
          const stageInfo = STAGES[stage]
          
          return (
            <div key={stage} className="flex items-center">
              <div className={`flex flex-col items-center ${index < stages.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    stageInfo.icon
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {stageInfo.title}
                  </div>
                  <div className="text-xs text-gray-500 max-w-32 hidden sm:block">
                    {stageInfo.description}
                  </div>
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  stages.indexOf(currentStage) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'upload':
        return (
          <DocumentUploadInterface
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onProgressUpdate={setUploadProgress}
          />
        )
      
      case 'processing':
        return sessionId ? (
          <ProcessingStatusTracker
            sessionId={sessionId}
            onProcessingComplete={handleProcessingComplete}
            onProcessingError={handleProcessingError}
          />
        ) : null
      
      case 'review':
        return sessionId ? (
          <QAReviewInterface
            sessionId={sessionId}
            onReviewComplete={handleReviewComplete}
            onSaveDraft={handleSaveDraft}
          />
        ) : null
      
      case 'complete':
        return (
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-black flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Collection Created Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600">
                Your document Q&A collection has been created and is ready to use.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={viewCollection}
                  className="bg-black text-white hover:bg-gray-900 rounded-full px-6"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Collection
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetToUpload}
                  className="rounded-full px-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Another Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="rounded-lg px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-3">
            Document Q&A Creation
          </h1>
          <p className="text-gray-600">
            Upload a document and let AI generate interview questions and answers for your collection
          </p>
        </div>

        {/* Stage Indicator */}
        {renderStageIndicator()}

        {/* Current Stage Content */}
        {renderCurrentStage()}
      </div>
    </div>
  )
}