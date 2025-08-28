'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Edit, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'


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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collection')
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
    } catch (err: unknown) {
      console.error('Error fetching QnA items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('この質問回答項目を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('qna_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      
      setQnaItems(qnaItems.filter(item => item.id !== itemId))
    } catch (err: unknown) {
      alert('項目の削除に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">コレクションを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
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
            <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-black">{collection.name}</h2>
            {collection.description && (
              <p className="text-gray-600">{collection.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/dashboard/collections/${collection.id}/qna/new`}>
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              質問回答を追加
            </Button>
          </Link>
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-2" />
            コレクション編集
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        {qnaItems.length} 個の質問回答項目 • 作成日: {new Date(collection.created_at).toLocaleDateString()}
      </div>

      {qnaItems.length === 0 ? (
        <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f9f0' }}>
              <FileText className="h-6 w-6" style={{ color: '#013220' }} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              質問回答項目がありません
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              最初の質問と回答を追加しましょう
            </p>
            <Link href={`/dashboard/collections/${collection.id}/qna/new`}>
              <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium mx-auto">
                <Plus className="h-4 w-4" />
                質問回答を追加
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {qnaItems.map((item) => (
            <Card key={item.id} className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-black">{item.question}</CardTitle>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/collections/${collection.id}/qna/${item.id}/edit`}>
                      <Button variant="outline" className="rounded-full px-3 py-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="rounded-full px-3 py-1 text-xs border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: '#f0f9f0', color: '#013220' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-4">
                  追加日: {new Date(item.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}