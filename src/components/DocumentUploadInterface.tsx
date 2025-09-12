'use client'

import React, { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Settings
} from 'lucide-react'

interface DocumentUploadProps {
  onUploadComplete: (sessionId: string) => void
  onUploadError: (error: string) => void
  onProgressUpdate: (progress: number) => void
}

interface ProcessingOptions {
  segmentationStrategy: 'semantic' | 'structural' | 'size-based' | 'auto'
  questionTypes: ('factual' | 'conceptual' | 'application' | 'analytical')[]
  maxQuestionsPerSegment: number
  qualityThreshold: number
  language: string
  reviewRequired: boolean
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  segmentationStrategy: 'auto',
  questionTypes: ['factual', 'conceptual', 'application'],
  maxQuestionsPerSegment: 3,
  qualityThreshold: 0.7,
  language: 'Japanese',
  reviewRequired: true
}

export default function DocumentUploadInterface({ 
  onUploadComplete, 
  onUploadError, 
  onProgressUpdate 
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>(DEFAULT_OPTIONS)
  const [validationError, setValidationError] = useState<string>('')

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const maxSize = 15 * 1024 * 1024 // 15MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 15MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF, PNG, and JPEG files are allowed' }
    }

    return { valid: true }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file')
      return
    }

    setSelectedFile(file)
    setValidationError('')
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    onProgressUpdate(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('processingOptions', JSON.stringify(processingOptions))

      // Upload file
      onProgressUpdate(25)
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      onProgressUpdate(50)

      // Trigger processing
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'dev-key'
        },
        body: JSON.stringify({ sessionId: result.sessionId })
      })

      if (!processResponse.ok) {
        console.warn('Failed to trigger processing, but upload was successful')
      }

      onProgressUpdate(100)
      onUploadComplete(result.sessionId)

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setValidationError('')
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />
    } else if (fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drop your document here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, PNG, and JPEG files up to 15MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpeg,.jpg"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button 
                  type="button" 
                  className="mt-4 bg-black text-white hover:bg-gray-900 rounded-full"
                  asChild
                >
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
          ) : (
            <div className="border rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.type)}
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {selectedFile.type === 'application/pdf' ? 'PDF' : 'Image'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {validationError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Options */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Processing Options
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Language</Label>
              <select
                value={processingOptions.language}
                onChange={(e) => setProcessingOptions({
                  ...processingOptions,
                  language: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              >
                <option value="Japanese">Japanese</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Max Questions per Segment</Label>
              <input
                type="number"
                min="1"
                max="10"
                value={processingOptions.maxQuestionsPerSegment}
                onChange={(e) => setProcessingOptions({
                  ...processingOptions,
                  maxQuestionsPerSegment: parseInt(e.target.value)
                })}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <Label className="text-sm font-medium text-gray-700">Question Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['factual', 'conceptual', 'application', 'analytical'].map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={processingOptions.questionTypes.includes(type as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProcessingOptions({
                              ...processingOptions,
                              questionTypes: [...processingOptions.questionTypes, type as any]
                            })
                          } else {
                            setProcessingOptions({
                              ...processingOptions,
                              questionTypes: processingOptions.questionTypes.filter(t => t !== type)
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Quality Threshold ({processingOptions.qualityThreshold})
                </Label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={processingOptions.qualityThreshold}
                  onChange={(e) => setProcessingOptions({
                    ...processingOptions,
                    qualityThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower Quality</span>
                  <span>Higher Quality</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Segmentation Strategy</Label>
                <select
                  value={processingOptions.segmentationStrategy}
                  onChange={(e) => setProcessingOptions({
                    ...processingOptions,
                    segmentationStrategy: e.target.value as any
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                >
                  <option value="auto">Automatic</option>
                  <option value="semantic">Semantic</option>
                  <option value="structural">Structural</option>
                  <option value="size-based">Size-based</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-3 text-lg font-medium"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Start Processing
            </>
          )}
        </Button>
      </div>
    </div>
  )
}