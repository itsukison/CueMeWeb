'use client'

import { useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { generateEmbeddingClient } from '@/lib/client-openai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewQnAPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return

    setLoading(true)
    setError('')

    try {
      // Generate embedding for the question
      const embedding = await generateEmbeddingClient(question.trim())
      
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const { data, error } = await supabase
        .from('qna_items')
        .insert([
          {
            collection_id: resolvedParams.id,
            question: question.trim(),
            answer: answer.trim(),
            tags: tagArray.length > 0 ? tagArray : null,
            embedding: embedding
          }
        ])
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/collections/${resolvedParams.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create QnA item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/collections/${resolvedParams.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Add New QnA Item</h2>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Question & Answer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                placeholder="Enter your interview question..."
                value={question}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                required
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                placeholder="Enter the detailed answer..."
                value={answer}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                required
                rows={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="e.g., javascript, react, hooks (comma-separated)"
                value={tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                Separate multiple tags with commas
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || !question.trim() || !answer.trim()}
              >
                {loading ? 'Creating & Generating Embedding...' : 'Create QnA Item'}
              </Button>
              <Link href={`/dashboard/collections/${resolvedParams.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
            
            {loading && (
              <div className="text-sm text-blue-600 p-3 bg-blue-50 rounded-md">
                Generating embedding for similarity search...
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}