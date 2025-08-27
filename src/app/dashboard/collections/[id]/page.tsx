'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Edit, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Collection {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface QnAItem {
  id: string
  question: string
  answer: string
  tags: string[] | null
  created_at: string
}

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [qnaItems, setQnaItems] = useState<QnAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCollection()
    fetchQnAItems()
  }, [resolvedParams.id])

  const fetchCollection = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_collections')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Collection not found')
        } else {
          throw error
        }
        return
      }

      setCollection(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collection')
    }
  }

  const fetchQnAItems = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_items')
        .select('*')
        .eq('collection_id', resolvedParams.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQnaItems(data || [])
    } catch (err: any) {
      console.error('Error fetching QnA items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this QnA item?')) return

    try {
      const { error } = await supabase
        .from('qna_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      setQnaItems(qnaItems.filter(item => item.id !== itemId))
    } catch (err: any) {
      alert('Failed to delete item: ' + err.message)
    }
  }

  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading collection...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!collection) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{collection.name}</h2>
            {collection.description && (
              <p className="text-gray-600">{collection.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/dashboard/collections/${collection.id}/qna/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add QnA
            </Button>
          </Link>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Collection
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        {qnaItems.length} QnA items • Created {new Date(collection.created_at).toLocaleDateString()}
      </div>

      {qnaItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No QnA items yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first question and answer to get started.
            </p>
            <Link href={`/dashboard/collections/${collection.id}/qna/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add QnA Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {qnaItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/collections/${collection.id}/qna/${item.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {item.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-4">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}