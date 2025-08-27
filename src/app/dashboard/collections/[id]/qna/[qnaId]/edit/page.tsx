'use client'

import { useEffect, useState, use } from 'react'
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

interface QnAItem {
  id: string
  collection_id: string
  question: string
  answer: string
  tags: string[] | null
}

export default function EditQnAPage({ 
  params 
}: { 
  params: Promise<{ id: string; qnaId: string }> 
}) {
  const resolvedParams = use(params)
  const [qnaItem, setQnaItem] = useState<QnAItem | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchQnAItem()
  }, [resolvedParams.qnaId])

  const fetchQnAItem = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_items')
        .select('*')
        .eq('id', resolvedParams.qnaId)
        .eq('collection_id', resolvedParams.id)
        .single()

      if (error) throw error

      setQnaItem(data)
      setQuestion(data.question)
      setAnswer(data.answer)
      setTags(data.tags ? data.tags.join(', ') : '')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch QnA item')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return

    setSaving(true)
    setError('')

    try {
      // Generate new embedding if question changed
      let embedding = null
      if (question.trim() !== qnaItem?.question) {
        embedding = await generateEmbeddingClient(question.trim())
      }
      
      // Parse tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const updateData: any = {
        question: question.trim(),
        answer: answer.trim(),
        tags: tagArray.length > 0 ? tagArray : null,
      }

      // Only update embedding if question changed
      if (embedding) {
        updateData.embedding = embedding
      }

      const { error } = await supabase
        .from('qna_items')
        .update(updateData)
        .eq('id', resolvedParams.qnaId)

      if (error) throw error

      router.push(`/dashboard/collections/${resolvedParams.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update QnA item')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading QnA item...</div>
      </div>
    )
  }

  if (error && !qnaItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/collections/${resolvedParams.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collection
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/collections/${resolvedParams.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collection
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Edit QnA Item</h2>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Edit Question & Answer</CardTitle>
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
                disabled={saving || !question.trim() || !answer.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/dashboard/collections/${resolvedParams.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
            
            {saving && question.trim() !== qnaItem?.question && (
              <div className="text-sm text-blue-600 p-3 bg-blue-50 rounded-md">
                Regenerating embedding due to question change...
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}