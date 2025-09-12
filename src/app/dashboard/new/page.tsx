'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function NewContentPage() {
  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="rounded-lg px-4 py-2 text-sm border-gray-300 text-gray-700 hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-3">
            新規コンテンツ作成
          </h1>
          <p className="text-gray-600">
            作成したいコンテンツのタイプを選択してください
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">
          {/* QnA Collection Option */}
          <Link href="/dashboard/collections/new" className="block">
            <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl h-full hover:shadow-xl transition-all hover:translate-y-[-5px]">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#f0f9f0" }}
                >
                  <MessageSquare className="h-8 w-8" style={{ color: "#013220" }} />
                </div>
                <CardTitle className="text-xl mb-2">Q&Aコレクション</CardTitle>
                <p className="text-gray-600 text-sm">
                  面接の質問と回答のコレクションを手動で作成します
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Document Option */}
          <Link href="/dashboard/documents" className="block">
            <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl h-full hover:shadow-xl transition-all hover:translate-y-[-5px]">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#f0f9f0" }}
                >
                  <FileText className="h-8 w-8" style={{ color: "#013220" }} />
                </div>
                <CardTitle className="text-xl mb-2">ドキュメント</CardTitle>
                <p className="text-gray-600 text-sm">
                  ドキュメントをアップロードしてAIが質問と回答を自動生成します
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}