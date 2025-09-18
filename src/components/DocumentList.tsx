'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Image, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

interface Document {
  id: string
  file_name: string
  display_name: string
  file_size: number
  file_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count: number
  created_at: string
}

interface DocumentListProps {
  refreshTrigger?: number
}

export default function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  const fetchDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const result = await response.json()
      setDocuments(result.documents || [])
      setError('')
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [refreshTrigger])

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(documentId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      // Remove from local state
      setDocuments(docs => docs.filter(doc => doc.id !== documentId))
    } catch (err) {
      console.error('Error deleting document:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />
    } else if (fileType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />
    }
    return <FileText className="h-6 w-6 text-gray-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading documents...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchDocuments} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No documents uploaded yet</p>
            <p className="text-sm text-gray-500">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getFileIcon(document.file_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.display_name || document.file_name}
                      </h3>
                      {getStatusIcon(document.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>{formatDate(document.created_at)}</span>
                      {document.status === 'completed' && (
                        <span>{document.chunk_count} chunks</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(document.status)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(document.id, document.display_name || document.file_name)}
                  disabled={deleting === document.id}
                  className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting === document.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}