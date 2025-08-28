"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { canCreateFile } from "@/lib/usage-enforcement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewCollectionPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザー認証が必要です");

      // Check if user can create a new file
      const canCreate = await canCreateFile(user.id);
      if (!canCreate.allowed) {
        throw new Error(canCreate.reason || "ファイル作成制限に達しています");
      }

      const { data, error } = await supabase
        .from("qna_collections")
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/collections/${data.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "コレクションの作成に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      {/* Back Button - Top Left */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
      </div>

      {/* Centered Content */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-6 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              新規コレクション作成
            </h2>
            <p className="text-gray-600">
              面接対策用の質問回答コレクションを作成します
            </p>
          </div>

          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#f0f9f0" }}
                >
                  <FolderPlus
                    className="h-5 w-5"
                    style={{ color: "#013220" }}
                  />
                </div>
                <span className="text-black">コレクション詳細</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-black"
                  >
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
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-black"
                  >
                    説明（任意）
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="このコレクションの内容について説明してください..."
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white/50 resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 font-semibold"
                  >
                    {loading ? "作成中..." : "コレクション作成"}
                  </Button>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      type="button"
                      className="rounded-full px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      キャンセル
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
