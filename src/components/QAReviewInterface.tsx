'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Save, 
  X, 
  Search,
  Filter,
  Star,
  FileText,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface QAReviewProps {
  sessionId: string
  onReviewComplete: (collectionId: string) => void
  onSaveDraft: (approvedItems: string[]) => void
}

interface QAItem {
  id: string
  question: string
  answer: string
  source_segment: string | null
  quality_score: number | null
  question_type: string | null
  review_status: 'pending' | 'approved' | 'rejected' | 'edited'
  original_question: string | null
  original_answer: string | null
}

interface ReviewData {
  sessionId: string
  collectionId: string
  items: QAItem[]
  processingStats: any
}

export default function QAReviewInterface({ 
  sessionId, 
  onReviewComplete, 
  onSaveDraft 
}: QAReviewProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'quality' | 'type' | 'order'>('quality')
  const [collectionName, setCollectionName] = useState('')
  const [editedItems, setEditedItems] = useState<Map<string, Partial<QAItem>>>(new Map())

  useEffect(() => {
    fetchReviewData()
  }, [sessionId])

  const fetchReviewData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/review/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReviewData(data)
        
        // Pre-approve items with quality score above 0.8
        const highQualityItems = data.items
          .filter((item: QAItem) => (item.quality_score || 0) >= 0.8)
          .map((item: QAItem) => item.id)
        setSelectedItems(new Set(highQualityItems))
        
        // Set default collection name
        setCollectionName(`Document Q&A Collection - ${new Date().toLocaleDateString()}`)
      } else {
        console.error('Failed to fetch review data')
      }
    } catch (error) {
      console.error('Review data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const selectAll = () => {
    const filteredItems = getFilteredItems()
    const allIds = filteredItems.map(item => item.id)
    setSelectedItems(new Set([...selectedItems, ...allIds]))
  }

  const deselectAll = () => {
    const filteredItems = getFilteredItems()
    const filteredIds = new Set(filteredItems.map(item => item.id))
    setSelectedItems(new Set([...selectedItems].filter(id => !filteredIds.has(id))))
  }

  const selectByQuality = (threshold: number) => {
    const highQualityItems = reviewData?.items
      .filter(item => (item.quality_score || 0) >= threshold)
      .map(item => item.id) || []
    setSelectedItems(new Set([...selectedItems, ...highQualityItems]))
  }

  const startEditing = (itemId: string) => {
    setEditingItems(new Set([...editingItems, itemId]))
    const item = reviewData?.items.find(i => i.id === itemId)
    if (item && !editedItems.has(itemId)) {
      setEditedItems(new Map(editedItems.set(itemId, {
        question: item.question,
        answer: item.answer
      })))
    }
  }

  const cancelEditing = (itemId: string) => {
    const newEditing = new Set(editingItems)
    newEditing.delete(itemId)
    setEditingItems(newEditing)
    
    const newEdited = new Map(editedItems)
    newEdited.delete(itemId)
    setEditedItems(newEdited)
  }

  const saveEdit = (itemId: string) => {
    const newEditing = new Set(editingItems)
    newEditing.delete(itemId)
    setEditingItems(newEditing)
    
    // Mark as selected since user edited it
    setSelectedItems(new Set([...selectedItems, itemId]))
  }

  const updateEditedItem = (itemId: string, field: 'question' | 'answer', value: string) => {
    const current = editedItems.get(itemId) || {}
    setEditedItems(new Map(editedItems.set(itemId, {
      ...current,
      [field]: value
    })))
  }

  const getDisplayItem = (item: QAItem): QAItem => {
    const edited = editedItems.get(item.id)
    if (edited) {
      return {
        ...item,
        question: edited.question || item.question,
        answer: edited.answer || item.answer
      }
    }
    return item
  }

  const getFilteredItems = () => {
    if (!reviewData) return []
    
    let filtered = reviewData.items

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        (item.source_segment && item.source_segment.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (filterType !== 'all') {
      if (filterType === 'approved') {
        filtered = filtered.filter(item => selectedItems.has(item.id))
      } else if (filterType === 'rejected') {
        filtered = filtered.filter(item => !selectedItems.has(item.id))
      } else if (filterType === 'pending') {
        filtered = filtered.filter(item => item.review_status === 'pending')
      }
    }

    // Apply sorting
    if (sortBy === 'quality') {
      filtered.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    } else if (sortBy === 'type') {
      filtered.sort((a, b) => (a.question_type || '').localeCompare(b.question_type || ''))
    }

    return filtered
  }

  const finalizeReview = async () => {
    if (!reviewData) return

    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Prepare edited items for submission
      const itemUpdates: any = {}
      editedItems.forEach((edits, itemId) => {
        if (selectedItems.has(itemId)) {
          itemUpdates[itemId] = edits
        }
      })

      const response = await fetch(`/api/documents/review/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          approvedItemIds: Array.from(selectedItems),
          collectionName: collectionName.trim(),
          itemEdits: itemUpdates
        })
      })

      if (response.ok) {
        const result = await response.json()
        onReviewComplete(result.collectionId)
      } else {
        const error = await response.json()
        console.error('Review submission error:', error)
      }
    } catch (error) {
      console.error('Finalize review error:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveDraft = () => {
    onSaveDraft(Array.from(selectedItems))
  }

  const getQualityColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-600'
    if (score >= 0.8) return 'bg-green-100 text-green-700'
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getQualityLabel = (score: number | null) => {
    if (!score) return 'Unknown'
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading review data...</span>
        </CardContent>
      </Card>
    )
  }

  if (!reviewData) {
    return (
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="flex items-center justify-center p-8">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-600">Failed to load review data</span>
        </CardContent>
      </Card>
    )
  }

  const filteredItems = getFilteredItems()
  const approvedCount = selectedItems.size
  const totalCount = reviewData.items.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Generated Q&A Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collection Name */}
          <div>
            <Label htmlFor="collection-name" className="text-sm font-medium text-gray-700">
              Collection Name
            </Label>
            <Input
              id="collection-name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              className="mt-1"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalCount - approvedCount}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reviewData.processingStats?.avg_quality_score 
                  ? (reviewData.processingStats.avg_quality_score * 100).toFixed(0) + '%'
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">Avg Quality</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Items</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="quality">Quality Score</option>
              <option value="type">Question Type</option>
              <option value="order">Original Order</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectByQuality(0.8)}>
              Select High Quality (≥80%)
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectByQuality(0.6)}>
              Select Medium+ Quality (≥60%)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Q&A Items List */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => {
          const displayItem = getDisplayItem(item)
          const isSelected = selectedItems.has(item.id)
          const isEditing = editingItems.has(item.id)
          
          return (
            <Card 
              key={item.id} 
              className={`bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl transition-all ${
                isSelected ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    {item.question_type && (
                      <Badge variant="outline" className="capitalize">
                        {item.question_type}
                      </Badge>
                    )}
                    {item.quality_score !== null && (
                      <Badge className={getQualityColor(item.quality_score)}>
                        <Star className="h-3 w-3 mr-1" />
                        {getQualityLabel(item.quality_score)} ({(item.quality_score * 100).toFixed(0)}%)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(item.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveEdit(item.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Question</Label>
                  {isEditing ? (
                    <Textarea
                      value={displayItem.question}
                      onChange={(e) => updateEditedItem(item.id, 'question', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                      {displayItem.question}
                    </p>
                  )}
                </div>

                {/* Answer */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Answer</Label>
                  {isEditing ? (
                    <Textarea
                      value={displayItem.answer}
                      onChange={(e) => updateEditedItem(item.id, 'answer', e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                      {displayItem.answer}
                    </p>
                  )}
                </div>

                {/* Source Segment */}
                {item.source_segment && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Source Segment
                    </Label>
                    <p className="mt-1 p-3 bg-blue-50 rounded-lg text-gray-700 text-sm">
                      {item.source_segment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No items match your search criteria</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saving}
            >
              Save Draft
            </Button>
            <Button
              onClick={finalizeReview}
              disabled={saving || selectedItems.size === 0 || !collectionName.trim()}
              className="bg-black text-white hover:bg-gray-900 rounded-full px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Collection...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Collection ({approvedCount} items)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}