'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewCollectionPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('qna_collections')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/collections/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create collection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Collection</h2>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="e.g., Frontend Interview Questions"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this collection contains..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Creating...' : 'Create Collection'}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}