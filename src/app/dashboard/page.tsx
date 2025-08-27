'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderOpen, FileText, Sparkles, TrendingUp, Clock, Target } from 'lucide-react'
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
        <div className="text-lg font-medium text-gray-700">コレクションを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <FolderOpen className="w-5 h-5 mx-auto mb-2" style={{ color: '#013220' }} />
            <div className="text-lg font-bold text-black">{collections.length}</div>
            <div className="text-gray-600 text-xs">コレクション</div>
          </CardContent>
        </Card>
        
        <Card className="text-center p-4 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <FileText className="w-5 h-5 mx-auto mb-2" style={{ color: '#013220' }} />
            <div className="text-lg font-bold text-black">
              {collections.reduce((sum, col) => sum + (col.qna_count || 0), 0)}
            </div>
            <div className="text-gray-600 text-xs">質問項目</div>
          </CardContent>
        </Card>
        
        <Card className="text-center p-4 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: '#013220' }} />
            <div className="text-lg font-bold text-black">85%</div>
            <div className="text-gray-600 text-xs">成功率</div>
          </CardContent>
        </Card>
        
        <Card className="text-center p-4 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: '#013220' }} />
            <div className="text-lg font-bold text-black">今日</div>
            <div className="text-gray-600 text-xs">最終更新</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">質問回答コレクション</h2>
          <p className="text-gray-600 text-sm">
            面接の質問と回答のコレクションを管理
          </p>
        </div>
        <Link href="/dashboard/collections/new">
          <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f9f0' }}>
              <FolderOpen className="h-6 w-6" style={{ color: '#013220' }} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              コレクションがありません
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              最初の質問回答コレクションを作成しましょう
            </p>
            <Link href="/dashboard/collections/new">
              <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium mx-auto">
                <Plus className="h-4 w-4" />
                作成する
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card 
              key={collection.id} 
              className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl group"
            >
              <Link href={`/dashboard/collections/${collection.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0f9f0' }}>
                      <FolderOpen className="h-4 w-4" style={{ color: '#013220' }} />
                    </div>
                    <span className="text-black font-semibold truncate">{collection.name}</span>
                  </CardTitle>
                  {collection.description && (
                    <CardDescription className="text-gray-600 text-sm line-clamp-2">
                      {collection.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1" style={{ color: '#013220' }}>
                      <FileText className="h-3 w-3" />
                      <span className="font-medium">{collection.qna_count} 項目</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                    </div>
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