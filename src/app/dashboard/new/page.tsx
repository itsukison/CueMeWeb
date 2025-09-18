"use client";

import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import Link from "next/link";

export default function NewContentPage() {
  return (
      <div className="min-h-screen" >
        {/* Header */}
        <div className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h1 className="text-4xl font-bold text-gray-900">
                ファイルを作成
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                新しいQ&Aコレクションまたはドキュメントを作成して、学習を始めましょう
              </p>
            </div>
          </div>
        </div>

        {/* Content Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto px-6 pb-16">
          {/* Q&A Collection Option */}
          <Link href="/dashboard/new/qa" className="group">
            <Card className="p-12 bg-white/70 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group-hover:scale-105">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "#f0f9f0" }}>
                  <MessageSquare className="w-12 h-12" style={{ color: "#013220" }} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-black mb-3">Q&A作成</h3>
                  <p className="text-gray-600 leading-relaxed">
                    質問と回答のペアを作成して、効率的な学習コレクションを構築します
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Document Upload Option */}
          <Link href="/dashboard/new/document" className="group">
            <Card className="p-12 bg-white/70 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group-hover:scale-105">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "#f0f9f0" }}>
                  <FileText className="w-12 h-12" style={{ color: "#013220" }} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-black mb-3">ドキュメントアップロード</h3>
                  <p className="text-gray-600 leading-relaxed">
                    PDFや文書ファイルをアップロードして、自動的にQ&Aを生成します
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
  );
}