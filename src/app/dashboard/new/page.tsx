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
  ArrowLeft,
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
    <div className="min-h-screen py-8 bg-app-bg">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex justify-start">
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              新しいファイルを作成
            </h1>
          </div>
        </div>

        {/* Create File Form */}
        <Card className="bg-card-light backdrop-blur-md border-0 shadow-lg rounded-container">
          <CardHeader>
            <CardTitle className="text-xl text-text-primary">ファイル情報</CardTitle>
            <CardDescription className="text-gray-600">
              作成後、このファイルにコンテンツを追加できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-card">
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
                placeholder="例: 〇〇の面接準備・ES"
                className="rounded-card border-card-dark focus:border-gray-400 bg-subtle-bg"
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
                className="rounded-card border-card-dark focus:border-gray-400 bg-subtle-bg resize-none"
                disabled={creating}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateFile}
                disabled={creating || !name.trim()}
                className="bg-text-primary text-white hover:bg-gray-900 rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2"
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
                  className="rounded-full px-6 py-2 text-sm border-card-dark text-gray-700 hover:bg-card-dark"
                >
                  キャンセル
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}