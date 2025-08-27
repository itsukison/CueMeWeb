'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderOpen, FileText } from 'lucide-react'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
  description: string | null
  created_at: string
  qna_count?: number
}

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_collections')
        .select(`
          *,
          qna_items(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        qna_count: collection.qna_items?.[0]?.count || 0
      })) || []

      setCollections(collectionsWithCount)
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">コレクションを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">質問回答コレクション</h2>
          <p className="text-gray-600">
            面接の質問と回答のコレクションを管理する
          </p>
        </div>
        <Link href="/dashboard/collections/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規コレクション
          </Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              コレクションがまだありません
            </h3>
            <p className="text-gray-600 mb-4">
              最初の質問回答コレクションを作成して、面接サポートを始めましょう。
            </p>
            <Link href="/dashboard/collections/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                コレクション作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={`/dashboard/collections/${collection.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {collection.name}
                  </CardTitle>
                  {collection.description && (
                    <CardDescription>{collection.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{collection.qna_count} 質問回答項目</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    作成日: {new Date(collection.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}