'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DocumentUploadInterface from '@/components/DocumentUploadInterface'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileText, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type ProcessingStage = 'upload' | 'processing' | 'complete'

export default function DocumentsPage() {
  const [currentStage, setCurrentStage] = useState<ProcessingStage>('upload')
  const [documentId, setDocumentId] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  const handleUploadComplete = (newDocumentId: string) => {
    setDocumentId(newDocumentId)
    setError('')
    setCurrentStage('processing')
    
    // Simulate processing time and then redirect to dashboard
    setTimeout(() => {
      setCurrentStage('complete')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }, 3000)
  }

  const handleUploadError = (errorMessage: string) => {
    // Check if it's a limit error that should redirect
    if (errorMessage === 'LIMIT_REACHED') {
      router.push('/dashboard/subscription')
      return
    }
    setError(errorMessage)
    setUploadProgress(0)
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
        return (
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-blue-50 rounded-full">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                文書を処理中...
              </h3>
              <p className="text-gray-600 mb-6">
                文書をテキストチャンクに分割し、ベクトル化しています。しばらくお待ちください。
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'complete':
        return (
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-green-50 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                処理完了！
              </h3>
              <p className="text-gray-600 mb-6">
                文書の処理が完了しました。ダッシュボードに戻ります...
              </p>
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
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="rounded-lg px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-3">
            文書アップロード
          </h1>
          <p className="text-gray-600">
            文書をアップロードして検索可能なチャンクに変換します
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラー</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderCurrentStage()}
      </div>
    </div>
  )
}