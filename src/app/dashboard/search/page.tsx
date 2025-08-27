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
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vector Search Test</h2>
        <p className="text-gray-600">
          Test the RAG functionality by searching through your QnA collections
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Search Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <select
                id="collection"
                value={selectedCollection}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCollection(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                placeholder="Ask a question..."
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !query.trim() || !selectedCollection}
              className="w-full"
            >
              {loading ? (
                <>Searching...</>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Search Results ({results.length} found)
          </h3>
          
          {results.map((result, index) => (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{result.question}</CardTitle>
                  <div className="text-sm text-blue-600 font-medium">
                    {(result.similarity * 100).toFixed(1)}% match
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
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
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
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No matches found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search query or add more QnA items to this collection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}