"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { generateEmbeddingClient } from "@/lib/client-openai";
import { clientUsageEnforcement } from "@/lib/usage-enforcement";
// Usage tracking handled via API calls
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FileText,
  Save,
  X,
  Minus,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import DocumentUpload from "@/components/DocumentUpload";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface QnAItem {
  id: string;
  question: string;
  answer: string;
  tags: string[] | null;
  created_at: string;
}

interface EditingQnAItem extends QnAItem {
  isEditing: boolean;
  editQuestion: string;
  editAnswer: string;
}

interface NewQnAItem {
  question: string;
  answer: string;
}

interface Document {
  id: string;
  display_name: string;
  file_name: string;
  status: string;
  created_at: string;
  chunk_count: number;
}

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [qnaItems, setQnaItems] = useState<EditingQnAItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [newQnAItems, setNewQnAItems] = useState<NewQnAItem[]>([]);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [addingNewItems, setAddingNewItems] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchCollection();
    fetchQnAItems();
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const fetchCollection = async () => {
    try {
      const { data, error } = await supabase
        .from("qna_collections")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setError("Collection not found");
        } else {
          throw error;
        }
        return;
      }

      setCollection(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collection"
      );
    }
  };

  const fetchQnAItems = async () => {
    try {
      const { data, error } = await supabase
        .from("qna_items")
        .select("*")
        .eq("collection_id", resolvedParams.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert to editing items with initial editing state
      const editingItems: EditingQnAItem[] = (data || []).map((item) => ({
        ...item,
        isEditing: false,
        editQuestion: item.question,
        editAnswer: item.answer,
      }));

      setQnaItems(editingItems);
    } catch (err: unknown) {
      console.error("Error fetching QnA items:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, display_name, file_name, status, created_at, chunk_count")
        .eq("collection_id", resolvedParams.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (err: unknown) {
      console.error("Error fetching documents:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("この質問回答項目を削除してもよろしいですか？")) return;

    try {
      const { error } = await supabase
        .from("qna_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setQnaItems(qnaItems.filter((item) => item.id !== itemId));

      // Track QnA deletion via API
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/usage/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            type: 'qna_pairs',
            count: -1
          })
        });
      }
    } catch (err: unknown) {
      alert(
        "項目の削除に失敗しました: " +
        (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleEditCollection = () => {
    setIsEditingCollection(true);
    setEditingCollectionName(collection?.name || "");
  };

  const handleSaveCollection = async () => {
    if (!collection || !editingCollectionName.trim()) return;

    try {
      const { error } = await supabase
        .from("qna_collections")
        .update({ name: editingCollectionName.trim() })
        .eq("id", collection.id);

      if (error) throw error;

      setCollection({ ...collection, name: editingCollectionName.trim() });
      setIsEditingCollection(false);
    } catch (err: unknown) {
      alert(
        "コレクション名の更新に失敗しました: " +
        (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleCancelEditCollection = () => {
    setIsEditingCollection(false);
    setEditingCollectionName("");
  };

  const handleEditItem = (itemId: string) => {
    setQnaItems(
      qnaItems.map((item) =>
        item.id === itemId ? { ...item, isEditing: true } : item
      )
    );
  };

  const handleSaveItem = async (itemId: string) => {
    const item = qnaItems.find((item) => item.id === itemId);
    if (!item || !item.editQuestion.trim() || !item.editAnswer.trim()) return;

    setSavingItems((prev) => new Set(prev).add(itemId));

    try {
      const embedding = await generateEmbeddingClient(item.editQuestion.trim());

      const { error } = await supabase
        .from("qna_items")
        .update({
          question: item.editQuestion.trim(),
          answer: item.editAnswer.trim(),
          tags: null,
          embedding: embedding,
        })
        .eq("id", itemId);

      if (error) throw error;

      setQnaItems(
        qnaItems.map((qnaItem) =>
          qnaItem.id === itemId
            ? {
              ...qnaItem,
              question: item.editQuestion.trim(),
              answer: item.editAnswer.trim(),
              tags: null,
              isEditing: false,
            }
            : qnaItem
        )
      );
    } catch (err: unknown) {
      alert(
        "項目の更新に失敗しました: " +
        (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSavingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCancelEditItem = (itemId: string) => {
    setQnaItems(
      qnaItems.map((item) =>
        item.id === itemId
          ? {
            ...item,
            isEditing: false,
            editQuestion: item.question,
            editAnswer: item.answer,
          }
          : item
      )
    );
  };

  const updateEditingItem = (
    itemId: string,
    field: "editQuestion" | "editAnswer",
    value: string
  ) => {
    setQnaItems(
      qnaItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const addNewQnAItem = () => {
    setNewQnAItems([...newQnAItems, { question: "", answer: "" }]);
  };

  const removeNewQnAItem = (index: number) => {
    setNewQnAItems(newQnAItems.filter((_, i) => i !== index));
  };

  const updateNewQnAItem = (
    index: number,
    field: keyof NewQnAItem,
    value: string
  ) => {
    const updated = [...newQnAItems];
    updated[index][field] = value;
    setNewQnAItems(updated);
  };

  const handleSaveNewItems = async () => {
    const validItems = newQnAItems.filter(
      (item) => item.question.trim() && item.answer.trim()
    );
    if (validItems.length === 0) return;

    setAddingNewItems(true);

    try {
      // Check usage limits for the batch of new items
      const canAdd = await clientUsageEnforcement.canAddQnAToFile(
        resolvedParams.id
      );
      if (!canAdd.allowed) {
        throw new Error(canAdd.reason || "QnA作成制限に達しています");
      }

      // Create QnA items
      const qnaInserts = await Promise.all(
        validItems.map(async (item) => {
          const embedding = await generateEmbeddingClient(item.question.trim());

          return {
            collection_id: resolvedParams.id,
            question: item.question.trim(),
            answer: item.answer.trim(),
            tags: null,
            embedding: embedding,
          };
        })
      );

      const { data, error } = await supabase
        .from("qna_items")
        .insert(qnaInserts)
        .select();

      if (error) throw error;

      // Add new items to the list
      const newEditingItems: EditingQnAItem[] = data.map((item) => ({
        ...item,
        isEditing: false,
        editQuestion: item.question,
        editAnswer: item.answer,
      }));

      setQnaItems([...newEditingItems, ...qnaItems]);
      setNewQnAItems([]);

      // Track QnA creation via API
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/usage/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            type: 'qna_pairs',
            count: validItems.length
          })
        });
      }
    } catch (err: unknown) {
      alert(
        "新しい項目の追加に失敗しました: " +
        (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setAddingNewItems(false);
    }
  };

  const handleDocumentUploadComplete = (documentId: string) => {
    setShowDocumentUpload(false);
    // Refresh documents list
    fetchDocuments();
    // Show success message
    alert("文書のアップロードが完了しました。処理が開始されます。");
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`「${documentName}」を削除してもよろしいですか？この操作は取り消せません。`)) {
      return;
    }

    setDeletingDocument(documentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ documentId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== documentId));

      // Show success message
      alert('文書が削除されました。');
    } catch (err: unknown) {
      console.error('Error deleting document:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingDocument(null);
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '処理完了';
      case 'processing':
        return '処理中';
      case 'failed':
        return '処理失敗';
      case 'pending':
        return '処理待ち';
      default:
        return status;
    }
  };

  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          コレクションを読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-sm"
            >
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
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen py-8" >
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="rounded-full px-4 py-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            </Link>
            <div className="flex-1">
              {isEditingCollection ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={editingCollectionName}
                    onChange={(e) => setEditingCollectionName(e.target.value)}
                    className="text-xl font-bold bg-white/70 border-gray-200 focus:border-gray-400 rounded-2xl h-auto py-2"
                    style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }}
                  />
                  <Button
                    onClick={handleSaveCollection}
                    size="sm"
                    className="bg-black text-white hover:bg-gray-900 rounded-full px-3 py-2"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEditCollection}
                    size="sm"
                    variant="outline"
                    className="rounded-full px-3 py-2 border-gray-300 text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {collection.name}
                    </h2>
                    {collection.description && (
                      <p className="text-gray-600">{collection.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleEditCollection}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {qnaItems.length === 0 && newQnAItems.length === 0 && documents.length === 0 ? (
          <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-xl">
            <CardContent>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                <FileText className="h-6 w-6" style={{ color: "#013220" }} />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                コンテンツがありません
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                質問回答を追加するか、文書をアップロードしましょう
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={addNewQnAItem}
                  className="bg-black text-white hover:bg-gray-900 rounded-2xl px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  質問回答を追加
                </Button>
                <Button
                  onClick={() => setShowDocumentUpload(true)}
                  variant="outline"
                  className="rounded-2xl px-4 py-2 flex items-center gap-2 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  文書をアップロード
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* QnA Items Section */}
            {qnaItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">
                  Q&Aペア
                </h3>
                <div className="space-y-4">
                  {qnaItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl ${item.isEditing
                        ? "bg-white/80 border border-gray-200"
                        : "bg-white/70"
                        }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          {item.isEditing ? (
                            <div className="flex-1 space-y-3">
                              <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                                  質問
                                </Label>
                                <Textarea
                                  value={item.editQuestion}
                                  onChange={(e) =>
                                    updateEditingItem(
                                      item.id,
                                      "editQuestion",
                                      e.target.value
                                    )
                                  }
                                  rows={1}
                                  className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/70 resize-none text-sm min-h-[2.5rem]"
                                />
                              </div>
                            </div>
                          ) : (
                            <CardTitle className="text-lg text-black leading-relaxed">
                              {item.question}
                            </CardTitle>
                          )}

                          <div className="flex gap-2 ml-4">
                            {item.isEditing ? (
                              <>
                                <Button
                                  onClick={() => handleSaveItem(item.id)}
                                  disabled={
                                    savingItems.has(item.id) ||
                                    !item.editQuestion.trim() ||
                                    !item.editAnswer.trim()
                                  }
                                  size="sm"
                                  className="bg-black text-white hover:bg-gray-900 rounded-full w-8 h-8 p-0 transition-colors"
                                >
                                  {savingItems.has(item.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleCancelEditItem(item.id)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full w-8 h-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                              onClick={() => handleEditItem(item.id)}
                              variant="outline"
                              size="sm"
                              className="rounded-full w-8 h-8 p-0 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteItem(item.id)}
                              variant="outline"
                              size="sm"
                              className="rounded-full w-8 h-8 p-0 text-xs border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {item.isEditing ? (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              回答
                            </Label>
                            <Textarea
                              value={item.editAnswer}
                              onChange={(e) =>
                                updateEditingItem(
                                  item.id,
                                  "editAnswer",
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/70 resize-none text-sm min-h-[4rem]"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-2 mt-4">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs rounded-full"
                                    style={{
                                      backgroundColor: "#f0f9f0",
                                      color: "#013220",
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Items Section - Moved Below Existing Items */}
            {newQnAItems.map((item, index) => (
                <Card
                  key={`new-${index}`}
                  className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-sm rounded-2xl"
                >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-black">
                      Q&Aペア {qnaItems.length + index + 1}
                    </h4>
                    <Button
                  onClick={() => removeNewQnAItem(index)}
                  variant="outline"
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        質問
                      </Label>
                      <Textarea
                        placeholder="面接で聞かれる質問を入力してください..."
                        value={item.question}
                        onChange={(e) =>
                          updateNewQnAItem(index, "question", e.target.value)
                        }
                        rows={1}
                        className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80 resize-none text-sm min-h-[2.5rem]"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        回答
                      </Label>
                      <Textarea
                        placeholder="詳細な回答を入力してください..."
                        value={item.answer}
                        onChange={(e) =>
                          updateNewQnAItem(index, "answer", e.target.value)
                        }
                        rows={3}
                        className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80 resize-none text-sm min-h-[4rem]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {newQnAItems.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveNewItems}
                    disabled={
                      addingNewItems ||
                      newQnAItems.every(
                        (item) => !item.question.trim() || !item.answer.trim()
                      )
                    }
                    className="bg-black text-white hover:bg-gray-900 rounded-lg px-6 py-2 text-sm font-medium transition-colors"
                  >
                    {addingNewItems
                      ? "保存中..."
                      : `${newQnAItems.length}個の新しいQ&Aを保存`}
                  </Button>
                  <Button
                    onClick={() => setNewQnAItems([])}
                    variant="outline"
                    className="rounded-lg px-6 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </Button>
                </div>
              )}

            </div>

            {/* Documents Section */}
            {documents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black border-b border-gray-200 pb-2">
                  ドキュメント
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((document) => (
                    <Card
                      key={document.id}
                      className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group relative"
                    >
                      <CardContent className="p-4">
                        {/* Delete button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDocument(document.id, document.display_name || document.file_name);
                          }}
                          disabled={deletingDocument === document.id}
                          className="absolute top-2 right-2 z-10 w-8 h-8 p-0 rounded-full bg-white/80 hover:bg-red-50 border-gray-200 hover:border-red-200 transition-opacity"
                        >
                          {deletingDocument === document.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                          )}
                        </Button>

                        <div className="flex items-start justify-between pr-8">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <h4 className="font-medium text-black text-sm truncate">
                                {document.display_name || document.file_name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {getDocumentStatusIcon(document.status)}
                              <span>{getDocumentStatusText(document.status)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Document Upload Section */}
            {showDocumentUpload && (
              <DocumentUpload
                collectionId={resolvedParams.id}
                onUploadComplete={handleDocumentUploadComplete}
                onCancel={() => setShowDocumentUpload(false)}
              />
            )}

            {/* Add New Item Buttons - Moved below Documents Section */}
            <div className="text-center space-y-3">
              <Button
                onClick={addNewQnAItem}
                variant="outline"
                className="rounded-lg border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                新しいQ&Aペアを追加
              </Button>
              <Button
                onClick={() => setShowDocumentUpload(true)}
                variant="outline"
                className="rounded-lg border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 transition-colors ml-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                文書をアップロード
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
