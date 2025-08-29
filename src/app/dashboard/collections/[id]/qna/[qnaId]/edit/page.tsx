"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { generateEmbeddingClient } from "@/lib/client-openai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QnAItem {
  id: string;
  collection_id: string;
  question: string;
  answer: string;
  tags: string[] | null;
}

export default function EditQnAPage({
  params,
}: {
  params: Promise<{ id: string; qnaId: string }>;
}) {
  const resolvedParams = use(params);
  const [qnaItem, setQnaItem] = useState<QnAItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchQnAItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.qnaId]);

  const fetchQnAItem = async () => {
    try {
      const { data, error } = await supabase
        .from("qna_items")
        .select("*")
        .eq("id", resolvedParams.qnaId)
        .eq("collection_id", resolvedParams.id)
        .single();

      if (error) throw error;

      setQnaItem(data);
      setQuestion(data.question);
      setAnswer(data.answer);
      setTags(data.tags ? data.tags.join(", ") : "");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "質問回答項目の取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setSaving(true);
    setError("");

    try {
      // Generate new embedding if question changed
      let embedding = null;
      if (question.trim() !== qnaItem?.question) {
        embedding = await generateEmbeddingClient(question.trim());
      }

      // Parse tags
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const updateData: Record<string, unknown> = {
        question: question.trim(),
        answer: answer.trim(),
        tags: tagArray.length > 0 ? tagArray : null,
      };

      // Only update embedding if question changed
      if (embedding) {
        updateData.embedding = embedding;
      }

      const { error } = await supabase
        .from("qna_items")
        .update(updateData)
        .eq("id", resolvedParams.qnaId);

      if (error) throw error;

      router.push(`/dashboard/collections/${resolvedParams.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "質問回答項目の更新に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          質問回答項目を読み込み中...
        </div>
      </div>
    );
  }

  if (error && !qnaItem) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/collections/${resolvedParams.id}`}>
            <Button
              variant="outline"
              className="rounded-full px-4 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              コレクションに戻る
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

  return (
    <div className="min-h-screen py-2">
      {/* Back Button - Top Left */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-2">
        <Link href={`/dashboard/collections/${resolvedParams.id}`}>
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            コレクションに戻る
          </Button>
        </Link>
      </div>

      {/* Centered Content */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl px-6 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              質問回答項目を編集
            </h2>
            <p className="text-gray-600">面接対策用の質問と回答を編集します</p>
          </div>

          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f0f9f0" }}
                >
                  <Edit3 className="h-5 w-5" style={{ color: "#013220" }} />
                </div>
                <span className="text-black">質問と回答の編集</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="question"
                    className="text-sm font-semibold text-black"
                  >
                    質問 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="question"
                    placeholder="面接で聞かれる質問を入力してください..."
                    value={question}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setQuestion(e.target.value)
                    }
                    required
                    rows={4}
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="answer"
                    className="text-sm font-semibold text-black"
                  >
                    回答 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="answer"
                    placeholder="詳細な回答を入力してください..."
                    value={answer}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAnswer(e.target.value)
                    }
                    required
                    rows={10}
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="tags"
                    className="text-sm font-semibold text-black"
                  >
                    タグ（任意）
                  </Label>
                  <Input
                    id="tags"
                    placeholder="例: JavaScript, React, フック（カンマ区切り）"
                    value={tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTags(e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
                  />
                  <p className="text-sm text-gray-600">
                    複数のタグはカンマで区切ってください
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving || !question.trim() || !answer.trim()}
                    className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 font-semibold"
                  >
                    {saving ? "保存中..." : "変更を保存"}
                  </Button>
                  <Link href={`/dashboard/collections/${resolvedParams.id}`}>
                    <Button
                      variant="outline"
                      type="button"
                      className="rounded-full px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      キャンセル
                    </Button>
                  </Link>
                </div>

                {saving && question.trim() !== qnaItem?.question && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-600">
                      質問が変更されたため、埋め込みベクトルを再生成しています...
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
