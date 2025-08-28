'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { searchQnAItems } from '@/lib/vector-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, FileText } from 'lucide-react'

interface Collection {
  id: string
  name: string
}

interface SearchResult {
  id: string
  question: string
  answer: string
  tags: string[]
  similarity: number
}

export default function SearchTestPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_collections')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCollections(data || [])
      
      if (data && data.length > 0) {
        setSelectedCollection(data[0].id)
      }
    } catch (err: unknown) {
      console.error('Error fetching collections:', err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !selectedCollection) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      const searchResults = await searchQnAItems(
        query.trim(),
        selectedCollection,
        0.5, // Lower threshold for testing
        10
      )
      setResults(searchResults)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">ベクトル検索テスト</h2>
        <p className="text-gray-600">
          質問回答コレクションを検索してRAG機能をテストします
        </p>
      </div>

      <div className="flex justify-center">
        <Card className="max-w-2xl w-full bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-black text-center">検索設定</CardTitle>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="collection" className="text-sm font-semibold text-black">コレクション</Label>
              <select
                id="collection"
                value={selectedCollection}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCollection(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/50 focus:border-gray-400"
                required
              >
                <option value="">コレクションを選択</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="query" className="text-sm font-semibold text-black">検索クエリ</Label>
              <Input
                id="query"
                placeholder="質問を入力してください..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                required
                className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !query.trim() || !selectedCollection}
              className="w-full bg-black text-white hover:bg-gray-900 rounded-full py-3 font-semibold"
            >
              {loading ? (
                <>検索中...</>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      {error && (
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-red-600 text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black text-center">
            検索結果 ({results.length} 件見つかりました)
          </h3>
          
          {results.map((result) => (
            <Card key={result.id} className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-black">{result.question}</CardTitle>
                  <div className="text-sm font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#f0f9f0', color: '#013220' }}>
                    {(result.similarity * 100).toFixed(1)}% 一致
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{result.answer}</p>
                </div>
                {result.tags && result.tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {result.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: '#f0f9f0', color: '#013220' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && query && selectedCollection && results.length === 0 && !error && (
        <Card className="text-center py-8 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f9f0' }}>
              <FileText className="h-6 w-6" style={{ color: '#013220' }} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              一致する結果が見つかりませんでした
            </h3>
            <p className="text-gray-600 text-sm">
              検索クエリを調整するか、このコレクションに質問回答項目を追加してください。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}