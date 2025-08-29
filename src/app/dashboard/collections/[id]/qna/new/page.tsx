"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { generateEmbeddingClient } from "@/lib/client-openai";
import { clientUsageEnforcement } from "@/lib/usage-enforcement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewQnAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザー認証が必要です");

      // Check if user can add a QnA to this file
      const canAdd = await clientUsageEnforcement.canAddQnAToFile(
        resolvedParams.id
      );
      if (!canAdd.allowed) {
        throw new Error(canAdd.reason || "QnA作成制限に達しています");
      }

      // Generate embedding for the question
      const embedding = await generateEmbeddingClient(question.trim());

      // Parse tags
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error } = await supabase
        .from("qna_items")
        .insert([
          {
            collection_id: resolvedParams.id,
            question: question.trim(),
            answer: answer.trim(),
            tags: tagArray.length > 0 ? tagArray : null,
            embedding: embedding,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/collections/${resolvedParams.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "質問回答項目の作成に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

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
              新しい質問回答項目を追加
            </h2>
            <p className="text-gray-600">面接対策用の質問と回答を作成します</p>
          </div>

          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f0f9f0" }}
                >
                  <Plus className="h-5 w-5" style={{ color: "#013220" }} />
                </div>
                <span className="text-black">質問と回答の詳細</span>
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
                    disabled={loading || !question.trim() || !answer.trim()}
                    className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 font-semibold"
                  >
                    {loading
                      ? "作成中・埋め込み生成中..."
                      : "質問回答項目を作成"}
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

                {loading && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-600">
                      類似検索用の埋め込みベクトルを生成しています...
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
