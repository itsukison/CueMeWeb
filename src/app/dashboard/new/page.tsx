"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  FileText,
  ArrowLeft,
  MessageSquare,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewContentPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateFile = async () => {
    if (!name.trim()) {
      setError("ファイル名を入力してください");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          throw new Error('ファイル作成制限に達しています。プランをアップグレードしてください。');
        }
        throw new Error(result.error || 'ファイルの作成に失敗しました');
      }

      // Redirect to the new collection
      router.push(`/dashboard/collections/${result.collection.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ファイルの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F7F7EE" }}>
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Header */}
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
          <div>
            <h1 className="text-2xl font-bold text-black">
              新しいファイルを作成
            </h1>
            <p className="text-gray-600 text-sm">
              Q&Aペアと文書の両方を管理できるファイルを作成します
            </p>
          </div>
        </div>

        {/* Create File Form */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-black">ファイル情報</CardTitle>
            <CardDescription className="text-gray-600">
              作成後、このファイルにQ&Aペアを追加したり、文書をアップロードできます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                ファイル名 *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 面接対策、プログラミング学習"
                className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                説明 (任意)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このファイルの内容や目的を説明してください"
                rows={3}
                className="rounded-lg border-gray-200 focus:border-gray-400 bg-white/80 resize-none"
                disabled={creating}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateFile}
                disabled={creating || !name.trim()}
                className="bg-black text-white hover:bg-gray-900 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    ファイルを作成
                  </>
                )}
              </Button>
              
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  disabled={creating}
                  className="rounded-lg px-6 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/50 backdrop-blur-md border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0f9f0" }}>
                  <MessageSquare className="h-5 w-5" style={{ color: "#013220" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">Q&Aペア</h3>
                  <p className="text-sm text-gray-600">
                    質問と回答のペアを手動で追加して、学習コンテンツを作成できます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-md border-0 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0f9f0" }}>
                  <FileText className="h-5 w-5" style={{ color: "#013220" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-2">文書アップロード</h3>
                  <p className="text-sm text-gray-600">
                    PDFや画像ファイルをアップロードして、自動的にQ&Aペアを生成できます
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}