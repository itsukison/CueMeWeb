"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { clientUsageEnforcement } from "@/lib/usage-enforcement";
import { ensureUsageTrackingExistsClient } from "@/lib/usage-tracking";
import { generateEmbeddingClient } from "@/lib/client-openai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QnAPair {
  question: string;
  answer: string;
}

export default function NewCollectionPage() {
  const [name, setName] = useState("");
  const [qnaPairs, setQnaPairs] = useState<QnAPair[]>([
    { question: "", answer: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const addQnAPair = () => {
    setQnaPairs([...qnaPairs, { question: "", answer: "" }]);
  };

  const removeQnAPair = (index: number) => {
    if (qnaPairs.length > 1) {
      setQnaPairs(qnaPairs.filter((_, i) => i !== index));
    }
  };

  const updateQnAPair = (
    index: number,
    field: keyof QnAPair,
    value: string
  ) => {
    const updatedPairs = [...qnaPairs];
    updatedPairs[index][field] = value;
    setQnaPairs(updatedPairs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate that at least one Q&A pair has both question and answer
    const validPairs = qnaPairs.filter(
      (pair) => pair.question.trim() && pair.answer.trim()
    );
    if (validPairs.length === 0) {
      setError("少なくとも1つの質問と回答のペアを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザー認証が必要です");

      // Check if user can create a new file
      const canCreate = await clientUsageEnforcement.canCreateFile();
      if (!canCreate.allowed) {
        throw new Error(canCreate.reason || "ファイル作成制限に達しています");
      }

      // Create the collection first
      const { data: collectionData, error: collectionError } = await supabase
        .from("qna_collections")
        .insert([
          {
            name: name.trim(),
            description: null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Check if user can add QnAs to this file
      for (const pair of validPairs) {
        const canAdd = await clientUsageEnforcement.canAddQnAToFile(
          collectionData.id
        );
        if (!canAdd.allowed) {
          throw new Error(canAdd.reason || "QnA作成制限に達しています");
        }
      }

      // Create QnA items
      const qnaInserts = await Promise.all(
        validPairs.map(async (pair) => {
          const embedding = await generateEmbeddingClient(pair.question.trim());

          return {
            collection_id: collectionData.id,
            question: pair.question.trim(),
            answer: pair.answer.trim(),
            tags: null,
            embedding: embedding,
          };
        })
      );

      const { error: qnaError } = await supabase
        .from("qna_items")
        .insert(qnaInserts);

      if (qnaError) throw qnaError;

      // Ensure usage tracking is initialized for this user
      await ensureUsageTrackingExistsClient();

      router.push(`/dashboard/collections/${collectionData.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "コレクションの作成に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="rounded-lg px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black mb-3">
            新規コレクション作成
          </h2>
          <p className="text-gray-600">
            面接対策用の質問回答コレクションと初期のQ&Aを作成します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Collection Name */}
          <div className="space-y-4">
            <Label htmlFor="name" className="text-sm font-semibold text-black">
              コレクション名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例: フロントエンド面接対策"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              required
              className="rounded-lg border-gray-200 focus:border-blue-400 bg-white/80 py-3 text-base transition-colors w-full"
            />
          </div>

          {/* Q&A Pairs */}
          <div className="space-y-6">
            <Label className="text-sm font-semibold text-black">
              質問と回答 <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-4">
              {qnaPairs.map((pair, index) => (
                <Card
                  key={index}
                  className="bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-xl transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Q&Aペア {index + 1}
                      </h4>
                      {qnaPairs.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQnAPair(index)}
                          className="rounded-lg px-3 py-1 text-xs border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          質問
                        </Label>
                        <Textarea
                          placeholder="面接で聞かれる質問を入力してください..."
                          value={pair.question}
                          onChange={(e) =>
                            updateQnAPair(index, "question", e.target.value)
                          }
                          rows={2}
                          className="rounded-lg border-gray-200 focus:border-blue-400 bg-white/80 resize-none text-sm transition-colors w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          回答
                        </Label>
                        <Textarea
                          placeholder="詳細な回答を入力してください..."
                          value={pair.answer}
                          onChange={(e) =>
                            updateQnAPair(index, "answer", e.target.value)
                          }
                          rows={4}
                          className="rounded-lg border-gray-200 focus:border-blue-400 bg-white/80 resize-none text-sm transition-colors w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addQnAPair}
              className="w-full rounded-lg border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 py-4 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Q&Aペアを追加
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                qnaPairs.every(
                  (pair) => !pair.question.trim() || !pair.answer.trim()
                )
              }
              className="bg-black text-white hover:bg-gray-900 rounded-lg px-8 py-3 font-semibold transition-colors"
            >
              {loading
                ? "作成中・埋め込み生成中..."
                : "コレクションとQ&Aを作成"}
            </Button>
            <Link href="/dashboard">
              <Button
                variant="outline"
                type="button"
                className="rounded-lg px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </Button>
            </Link>
          </div>

          {loading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">
                コレクションを作成し、質問の埋め込みベクトルを生成しています...
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
