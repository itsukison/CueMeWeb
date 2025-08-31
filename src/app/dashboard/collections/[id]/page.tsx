"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { generateEmbeddingClient } from "@/lib/client-openai";
import { clientUsageEnforcement } from "@/lib/usage-enforcement";
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
} from "lucide-react";
import Link from "next/link";

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

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [qnaItems, setQnaItems] = useState<EditingQnAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [newQnAItems, setNewQnAItems] = useState<NewQnAItem[]>([]);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [addingNewItems, setAddingNewItems] = useState(false);

  useEffect(() => {
    fetchCollection();
    fetchQnAItems();
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

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("この質問回答項目を削除してもよろしいですか？")) return;

    try {
      const { error } = await supabase
        .from("qna_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setQnaItems(qnaItems.filter((item) => item.id !== itemId));
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
      // Check usage limits for each new item
      for (const item of validItems) {
        const canAdd = await clientUsageEnforcement.canAddQnAToFile(
          resolvedParams.id
        );
        if (!canAdd.allowed) {
          throw new Error(canAdd.reason || "QnA作成制限に達しています");
        }
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
    } catch (err: unknown) {
      alert(
        "新しい項目の追加に失敗しました: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setAddingNewItems(false);
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
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F7F7EE" }}>
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
                    className="text-xl font-bold bg-white/70 border-gray-200 focus:border-gray-400 rounded-lg h-auto py-2"
                    style={{ fontSize: "1.25rem", lineHeight: "1.75rem" }}
                  />
                  <Button
                    onClick={handleSaveCollection}
                    size="sm"
                    className="bg-black text-white hover:bg-gray-900 rounded-lg px-3 py-2"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEditCollection}
                    size="sm"
                    variant="outline"
                    className="rounded-lg px-3 py-2 border-gray-300 text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-gray-600">{collection.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEditCollection}
              variant="outline"
              className="rounded-lg px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              コレクション編集
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {qnaItems.length} 個の質問回答項目 • 作成日:{" "}
          {new Date(collection.created_at).toLocaleDateString()}
        </div>

        {qnaItems.length === 0 && newQnAItems.length === 0 ? (
          <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-xl">
            <CardContent>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                <FileText className="h-6 w-6" style={{ color: "#013220" }} />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">
                質問回答項目がありません
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                最初の質問と回答を追加しましょう
              </p>
              <Button
                onClick={addNewQnAItem}
                className="bg-black text-white hover:bg-gray-900 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium mx-auto transition-colors"
              >
                <Plus className="h-4 w-4" />
                質問回答を追加
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Existing Items */}
            {qnaItems.map((item) => (
              <Card
                key={item.id}
                className={`backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl ${
                  item.isEditing
                    ? "bg-white/80 border border-gray-200"
                    : "bg-white/70"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    {item.isEditing ? (
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600 mb-1 block">
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
                            rows={2}
                            className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/70 resize-none text-sm"
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
                            className="bg-black text-white hover:bg-gray-900 rounded-lg px-3 py-2 transition-colors"
                          >
                            {savingItems.has(item.id) ? (
                              <span className="text-xs">保存中...</span>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleCancelEditItem(item.id)}
                            size="sm"
                            variant="outline"
                            className="rounded-lg px-3 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleEditItem(item.id)}
                            variant="outline"
                            className="rounded-lg px-3 py-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-lg px-3 py-1 text-xs border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleDeleteItem(item.id)}
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
                      <Label className="text-xs font-medium text-gray-600 mb-1 block">
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
                        rows={4}
                        className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/70 resize-none text-sm"
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
                      <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                        追加日: {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add New Items Section - Moved Below Existing Items */}
            {newQnAItems.map((item, index) => (
              <Card
                key={`new-${index}`}
                className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-black">
                      Q&Aペア {qnaItems.length + index + 1}
                    </h4>
                    <Button
                      onClick={() => removeNewQnAItem(index)}
                      size="sm"
                      variant="outline"
                      className="rounded-lg px-3 py-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        質問
                      </Label>
                      <Textarea
                        placeholder="面接で聞かれる質問を入力してください..."
                        value={item.question}
                        onChange={(e) =>
                          updateNewQnAItem(index, "question", e.target.value)
                        }
                        rows={2}
                        className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80 resize-none text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        回答
                      </Label>
                      <Textarea
                        placeholder="詳細な回答を入力してください..."
                        value={item.answer}
                        onChange={(e) =>
                          updateNewQnAItem(index, "answer", e.target.value)
                        }
                        rows={4}
                        className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80 resize-none text-sm"
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

              {/* Add New Item Button */}
              <div className="text-center">
                <Button
                  onClick={addNewQnAItem}
                  variant="outline"
                  className="rounded-lg border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新しいQ&Aペアを追加
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
